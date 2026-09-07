/**
 * One-time save: first Google login only. You complete sign-in; we save as soon as you're back on the app.
 * Any next screen (e.g. signup, "Continue offline") is handled in the test only.
 *
 * Run:
 *   Nucleum:  npm run e2e:save-auth:nucleum   (or APP_BASE_URL=https://local.nucleum.app npm run e2e:save-auth)
 *   Memotron: npm run e2e:save-auth:memotron  (or PRODUCT=memotron APP_BASE_URL=https://local.memotron.app npm run e2e:save-auth)
 *   Pointron: npm run e2e:save-auth:pointron   (or PRODUCT=pointron APP_BASE_URL=https://local.pointron.app npm run e2e:save-auth)
 */

import "dotenv/config";
import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { Product } from "@nucleum/client/config/product.type";

const authDir = path.join(__dirname, "..", ".auth");
const product = (process.env.PRODUCT ?? Product.NUCLEUM).toLowerCase();
const authFileName =
  product === Product.NUCLEUM ? "user.json" : `user-${product}.json`;
const authStatePath = path.join(authDir, authFileName);
const baseURL = process.env.APP_BASE_URL ?? "http://127.0.0.1:4173";
const waitForRedirectBackMs = 120_000;

const baseOrigin = new URL(baseURL).origin;
const baseHost = new URL(baseURL).host;
const allowedOrigins = [
  baseOrigin,
  baseOrigin.startsWith("http:") ? `https://${baseHost}` : `http://${baseHost}`,
  "https://dev.nucleum.app",
  "http://dev.nucleum.app",
  "https://local.nucleum.app",
  "http://local.nucleum.app",
  "https://local.memotron.app",
  "http://local.memotron.app",
  "https://dev.memotron.to",
  "http://dev.memotron.to",
  "https://local.pointron.app",
  "http://local.pointron.app",
  "https://dev.pointron.to",
  "http://dev.pointron.to"
];
const allowedOriginsSet = new Set(allowedOrigins);

function resolveAccountBaseUrl(appBaseUrl: string, region = "insouth") {
  const url = new URL(appBaseUrl);
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
    return null;
  }
  const labels = host.split(".").filter(Boolean);
  const subdomain = labels[0] ?? "";
  const env =
    subdomain === "local" || subdomain === "dev" || subdomain === "pre"
      ? subdomain
      : subdomain === "web" || subdomain === "app"
        ? "live"
      : "dev";
  const domain = ["local", "dev", "pre", "web", "app"].includes(subdomain)
    ? labels.slice(1).join(".")
    : labels.slice(-2).join(".");
  const envSuffix = env === "live" ? "" : `-${env}`;
  return `https://account-${region}${envSuffix}.${domain}`;
}

function resolveParentDomain(appBaseUrl: string) {
  const hostname = new URL(appBaseUrl).hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") return hostname;
  return hostname.includes(".")
    ? hostname.split(".").slice(-2).join(".")
    : hostname;
}

async function main() {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  console.log("Product:", product);
  console.log("Base URL:", baseURL);
  console.log("Auth will be saved to:", authStatePath);
  console.log("Opening browser - complete Google sign-in once. We save as soon as you're back on the app.");
  console.log("If you see another login/signup screen after that, the test will handle it.\n");

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
  });
  const context = await browser.newContext({
    viewport: { width: 1512, height: 982 },
    ignoreHTTPSErrors: true,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/account/login`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/account\/login/, { timeout: 10_000 });

    const googleButton = page
      .getByRole("button", { name: /Continue with Google/i })
      .or(page.locator("#google-signin"))
      .first();

    await googleButton.waitFor({ state: "visible", timeout: 10_000 });
    await googleButton.click({ timeout: 10_000 });

    console.log("Complete Google sign-in in the browser. Waiting up to", waitForRedirectBackMs / 1000, "s for redirect back...\n");

    const appOrigin = new URL(baseURL).origin;

    const isBackOnApp = (url: URL) =>
      allowedOriginsSet.has(url.origin) &&
      (["/", "/signup", "/calendar"].includes(url.pathname) ||
        url.pathname.startsWith("/calendar/") ||
        url.pathname.includes("/oauth"));

    await page.waitForURL((url) => {
      const u = new URL(url.toString());
      return !(u.origin === appOrigin && u.pathname === "/account/login");
    }, {
      timeout: waitForRedirectBackMs
    });

    await page.waitForURL((url) => isBackOnApp(new URL(url.toString())), {
      timeout: waitForRedirectBackMs
    });
    const landedOrigin = new URL(page.url()).origin;
    const parentDomain = resolveParentDomain(baseURL);
    const hasSessionCookie = async () => {
      const cookies = await context.cookies();
      return cookies.some((cookie) => {
        if (cookie.expires > 0 && cookie.expires <= Date.now() / 1000 + 60) {
          return false;
        }
        const isSessionCookie =
          cookie.name.includes("session_token") ||
          cookie.name.endsWith(".session");
        if (!isSessionCookie) return false;
        return (
          cookie.domain === parentDomain ||
          cookie.domain === `.${parentDomain}` ||
          cookie.domain.endsWith(`.${parentDomain}`)
        );
      });
    };
    const hasAuthFnBrowserSession = async () => {
      const accountBaseUrl = resolveAccountBaseUrl(baseURL);
      if (!accountBaseUrl) return false;
      return page
        .evaluate(async (url) => {
          const response = await fetch(`${url}/auth/session`, {
            credentials: "include"
          });
          const json = await response.json().catch(() => null);
          return Boolean(response.ok && json?.data?.session);
        }, accountBaseUrl)
        .catch(() => false);
    };
    const deadline = Date.now() + 30_000;
    let hasSavedAuthSession = false;
    while (Date.now() < deadline) {
      if ((await hasSessionCookie()) && (await hasAuthFnBrowserSession())) {
        hasSavedAuthSession = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    if (!hasSavedAuthSession) {
      throw new Error(
        "AuthFn session was not detected; refusing to save unauthenticated storageState."
      );
    }

    await context.storageState({ path: authStatePath, indexedDB: true });
    console.log("Back on app. Saved auth state to", authStatePath);
    console.log("Done. Run tests with: npx playwright test --project=" + product);
    if (landedOrigin !== new URL(baseURL).origin) {
      console.log("\nNote: You were redirected to", landedOrigin, "- set APP_BASE_URL=" + landedOrigin, "in .env to run tests there.");
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
