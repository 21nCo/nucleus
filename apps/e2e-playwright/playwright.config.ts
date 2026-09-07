import { devices, defineConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { Product } from "@nucleum/client/config/product.type";

import { isE2ECloudAuthMode, resolveE2EAuthMode } from "./config/auth-mode";
import "dotenv/config";

const artifactsDir = path.join(__dirname, "artifacts");
const authDir = path.join(__dirname, ".auth");

const defaultBaseURL = process.env.APP_BASE_URL ?? "http://127.0.0.1:4173";
const authMode = resolveE2EAuthMode();
const chromeLikeUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const chromeLaunchOptions = {
  args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
};
const defaultViewport = { width: 1512, height: 982 } as const;

function getProjectBaseURL(projectName: string): string {
  if (projectName === Product.NUCLEUM) {
    return (
      process.env.APP_BASE_URL_NUCLEUM ??
      process.env.APP_BASE_URL ??
      defaultBaseURL
    );
  }
  const envKey = `APP_BASE_URL_${projectName.toUpperCase()}`;
  return process.env[envKey] ?? process.env.APP_BASE_URL ?? defaultBaseURL;
}

function getAuthFilePath(projectName: string): string {
  const fileName =
    projectName === Product.NUCLEUM ? "user.json" : `user-${projectName}.json`;
  return path.join(authDir, fileName);
}

function getProjectUse(projectName: string) {
  const baseURL = getProjectBaseURL(projectName);
  const authPath = getAuthFilePath(projectName);
  const use = {
    ...devices["Desktop Chrome"],
    viewport: defaultViewport,
    video: "on" as const,
    trace: "on-first-retry" as const,
    screenshot: "only-on-failure" as const,
    // Local dev uses Caddy `tls internal`; Playwright's bundled Chromium may not honor OS trust store.
    // Keeping this avoids CI/local flakes while still testing app behavior over HTTPS.
    ignoreHTTPSErrors: true,
    channel: "chrome" as const,
    userAgent: chromeLikeUserAgent,
    launchOptions: chromeLaunchOptions,
    baseURL
  };
  if (isE2ECloudAuthMode(authMode) && fs.existsSync(authPath)) {
    (use as { storageState?: string }).storageState = authPath;
  }
  return use;
}

export default defineConfig({
  testDir: path.join(__dirname, "tests"),
  globalSetup: path.join(__dirname, "global-setup.ts"),
  globalTeardown: path.join(__dirname, "global-teardown.ts"),
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  reporter: process.env.CI
    ? [
        ["junit", { outputFile: path.join(artifactsDir, "junit.xml") }],
        [
          "html",
          {
            open: "never",
            outputFolder: path.join(artifactsDir, "html-report")
          }
        ]
      ]
    : [
        ["list"],
        [
          "html",
          {
            open: "never",
            outputFolder: path.join(artifactsDir, "html-report")
          }
        ]
      ],
  use: {
    baseURL: defaultBaseURL,
    viewport: defaultViewport,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    // Local dev uses Caddy `tls internal`; Playwright's bundled Chromium may not honor OS trust store.
    // Keeping this avoids CI/local flakes while still testing app behavior over HTTPS.
    ignoreHTTPSErrors: true,
    channel: "chrome",
    userAgent: chromeLikeUserAgent,
    launchOptions: chromeLaunchOptions
  },
  projects: [
    {
      name: Product.NUCLEUM,
      testMatch: [
        "tests/smoke/**/*.spec.ts",
        "tests/shared/**/*.spec.ts",
        "tests/nucleum/**/*.spec.ts",
        "tests/focus/**/*.spec.ts",
        "tests/memory/**/*.spec.ts"
      ],
      retries: 1,
      workers: 1,
      use: getProjectUse(Product.NUCLEUM)
    },
    {
      name: Product.POINTRON,
      testMatch: [
        "tests/smoke/**/*.spec.ts",
        "tests/shared/**/*.spec.ts",
        "tests/pointron/**/*.spec.ts",
        "tests/focus/**/*.spec.ts"
      ],
      retries: 1,
      workers: 1,
      use: getProjectUse(Product.POINTRON)
    },
    {
      name: Product.MEMOTRON,
      testMatch: [
        "tests/smoke/**/*.spec.ts",
        "tests/shared/**/*.spec.ts",
        "tests/memotron/**/*.spec.ts",
        "tests/memory/**/*.spec.ts"
      ],
      retries: 1,
      workers: 1,
      use: getProjectUse(Product.MEMOTRON)
    }
  ]
});
