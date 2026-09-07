import path from "node:path";
import fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { Product } from "@21n/types/product.type";

import {
  isE2ECloudAuthMode,
  resolveE2EAuthMode,
  type E2EAuthMode
} from "./config/auth-mode";
import type { FullConfig } from "@playwright/test";

type ViteHarness = {
  close: () => Promise<void>;
  url: string;
  process: ChildProcess;
};

type ProjectKey =
  | typeof Product.NUCLEUM
  | typeof Product.MEMOTRON
  | typeof Product.POINTRON;

type StorageState = {
  cookies?: Array<{
    name: string;
    value: string;
    domain: string;
    path?: string;
    expires?: number;
  }>;
  origins?: Array<{
    origin: string;
    localStorage?: Array<{ name: string; value: string }>;
  }>;
};

const projectAppMap: Record<ProjectKey, string> = {
  [Product.NUCLEUM]: "apps/nucleus",
  [Product.MEMOTRON]: "apps/memotron",
  [Product.POINTRON]: "apps/pointron"
};
const defaultBaseURL = "http://127.0.0.1:4173";

const setupLog = (...args: unknown[]) => {
  process.stderr.write(`${args.map(String).join(" ")}\n`);
};

const setupWarn = (...args: unknown[]) => {
  process.stderr.write(`${args.map(String).join(" ")}\n`);
};

function isProjectKey(value: string): value is ProjectKey {
  return (
    value === Product.NUCLEUM ||
    value === Product.MEMOTRON ||
    value === Product.POINTRON
  );
}

function getRequestedProjectsFromArgv(): ProjectKey[] {
  const values: string[] = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg === "--project") {
      const next = process.argv[i + 1];
      if (next) values.push(next);
      continue;
    }
    if (arg.startsWith("--project=")) {
      values.push(arg.slice("--project=".length));
    }
  }
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(isProjectKey);
}

function stripAnsi(value: string | Buffer | null | undefined): string {
  if (value == null) return "";
  const text = typeof value === "string" ? value : value.toString();
  return text.replace(/\u001B\[[0-9;]*m/g, "");
}

function resolveReadyUrl(output: string, port: number): string | undefined {
  const localUrls = Array.from(
    output.matchAll(/Local:\s+(https?:\/\/[^\s]+)/g)
  );
  const localUrl = localUrls.at(-1)?.[1];
  if (localUrl) return localUrl;
  if (output.includes("ready in") && !output.includes("Port 5173 is in use")) {
    return `http://127.0.0.1:${port}`;
  }
  return undefined;
}

async function startVite(app: string): Promise<ViteHarness> {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const root = path.join(repoRoot, app);
  const port = 5173;

  setupLog(`Starting dev server for ${app} on port ${port}...`);

  const viteProcess = spawn(
    "npm",
    ["run", "dev", "--", "--port", port.toString(), "--host", "127.0.0.1"],
    {
      cwd: root,
      stdio: "pipe",
      shell: true
    }
  );

  return new Promise((resolve, reject) => {
    let resolved = false;
    let outputLog = "";
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        viteProcess.kill("SIGTERM");
        reject(
          new Error(
            `Timeout waiting for dev server to start.${outputLog ? ` Last output:\n${outputLog}` : ""}`
          )
        );
      }
    }, 60000);

    viteProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      process.stderr.write(output);

      const normalized = stripAnsi(output);
      outputLog = (outputLog + normalized).slice(-4000);
      const readyUrl = resolveReadyUrl(outputLog, port);

      if (readyUrl) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          setupLog(`Dev server started at ${readyUrl}`);
          resolve({
            url: readyUrl,
            process: viteProcess,
            async close() {
              viteProcess.kill();
            }
          });
        }
      }
    });

    viteProcess.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(data);
      outputLog = (outputLog + stripAnsi(data)).slice(-4000);
    });

    viteProcess.on("error", (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(error);
      }
    });

    viteProcess.on("exit", (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`Dev server exited with code ${code}`));
      }
    });
  });
}

async function warmUpViteUrl(url: string) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        errors.push(message.text());
      });
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30_000
        });
        await page.waitForTimeout(2_000);
      } catch (error) {
        errors.push((error as Error).message);
      }
      const hasOptimizeDepFailure = errors.some(
        (error) =>
          /Outdated Optimize Dep/i.test(error) ||
          /Failed to fetch dynamically imported module/i.test(error)
      );
      await page.close();
      if (!hasOptimizeDepFailure) return;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  } finally {
    await browser.close();
  }
}

const PER_PROJECT_URL_KEYS = [
  "APP_BASE_URL_NUCLEUM",
  "APP_BASE_URL_MEMOTRON",
  "APP_BASE_URL_POINTRON"
] as const;

function getPerProjectBaseUrl(project: ProjectKey): string | undefined {
  if (project === Product.NUCLEUM) {
    return process.env.APP_BASE_URL_NUCLEUM?.trim();
  }
  const envKey =
    project === Product.MEMOTRON
      ? "APP_BASE_URL_MEMOTRON"
      : "APP_BASE_URL_POINTRON";
  return process.env[envKey]?.trim();
}

function setPerProjectBaseUrl(project: ProjectKey, url: string) {
  if (project === Product.NUCLEUM) {
    process.env.APP_BASE_URL_NUCLEUM = url;
    return;
  }
  if (project === Product.MEMOTRON) {
    process.env.APP_BASE_URL_MEMOTRON = url;
    return;
  }
  process.env.APP_BASE_URL_POINTRON = url;
}

function areAllPerProjectBaseUrlsSet(): boolean {
  return PER_PROJECT_URL_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

function getFirstPerProjectBaseUrl(): string | undefined {
  return PER_PROJECT_URL_KEYS.map((key) => process.env[key]?.trim()).find((v) =>
    Boolean(v)
  );
}

function getAuthFilePath(project: ProjectKey): string {
  const fileName =
    project === Product.NUCLEUM ? "user.json" : `user-${project}.json`;
  return path.join(__dirname, ".auth", fileName);
}

function assertAuthStateExists(projects: ProjectKey[], authMode: E2EAuthMode) {
  if (!isE2ECloudAuthMode(authMode)) return;
  const missing = projects.filter(
    (project) => !fs.existsSync(getAuthFilePath(project))
  );
  if (missing.length === 0) return;
  if (canAutoRefreshAuthState()) return;
  throw new Error(
    [
      `Missing Playwright AuthFn storage state for ${missing.join(", ")}.`,
      "Generate it before running authenticated app tests.",
      "For Nucleum: cd apps/e2e-playwright && npm run e2e:save-email-auth:nucleum",
      "Required env: E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD."
    ].join(" ")
  );
}

function requestStatus(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<{
  status: number;
  headers: Record<string, string | string[] | undefined>;
}> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.request(
      parsed,
      {
        method: options.method ?? "GET",
        headers: options.headers,
        rejectUnauthorized: false
      },
      (res) => {
        res.resume();
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function requestText(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<{
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.request(
      parsed,
      {
        method: options.method ?? "GET",
        headers: options.headers,
        rejectUnauthorized: false
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function assertLocalNucleumAccountHealth(baseURL: string | undefined) {
  if (process.env.E2E_CHECK_LOCAL_ACCOUNT_HEALTH === "false") return;
  if (!baseURL) return;
  const appUrl = new URL(baseURL);
  if (appUrl.origin !== "https://local.nucleum.app") return;

  const accountOrigin = "https://account-insouth-local.nucleum.app";
  let sessionStatus: { status: number };
  let preflightStatus: {
    status: number;
    headers: Record<string, string | string[] | undefined>;
  };
  try {
    sessionStatus = await requestStatus(`${accountOrigin}/auth/session`);
    preflightStatus = await requestStatus(`${accountOrigin}/datafn/query`, {
      method: "OPTIONS",
      headers: {
        Origin: appUrl.origin,
        "Access-Control-Request-Method": "POST"
      }
    });
  } catch (error) {
    throw new Error(
      [
        "Nucleum local account-service health check failed before Playwright started.",
        `Base URL: ${baseURL}`,
        `Account URL: ${accountOrigin}`,
        "Start the account service with: npm --workspace @21n/account-service run dev:local",
        `Request error: ${(error as Error).message}`
      ].join(" ")
    );
  }

  const allowOrigin = preflightStatus.headers["access-control-allow-origin"];
  if (
    sessionStatus.status >= 500 ||
    preflightStatus.status !== 204 ||
    allowOrigin !== appUrl.origin
  ) {
    throw new Error(
      [
        "Nucleum local account-service health check failed before Playwright started.",
        `Base URL: ${baseURL}`,
        `Expected ${accountOrigin}/datafn/query OPTIONS to return 204 with access-control-allow-origin: ${appUrl.origin}.`,
        `Observed /auth/session status ${sessionStatus.status}, preflight status ${preflightStatus.status}, allow-origin ${String(allowOrigin)}.`,
        "A 502 usually means the account-service upstream is not running on localhost:8787; debug-sink health is separate.",
        "Start the account service with: npm --workspace @21n/account-service run dev:local",
        "Set E2E_CHECK_LOCAL_ACCOUNT_HEALTH=false only when intentionally testing without the Caddy account backend."
      ].join(" ")
    );
  }
}

async function assertRequestedLocalAccountHealth(
  requestedProjects: ProjectKey[],
  baseUrls: Partial<Record<ProjectKey, string | undefined>>,
  authMode: E2EAuthMode
) {
  if (!isE2ECloudAuthMode(authMode)) return;
  if (!requestedProjects.includes(Product.NUCLEUM)) return;
  await assertLocalNucleumAccountHealth(baseUrls[Product.NUCLEUM]);
}

function resolveProjectBaseUrlsFromEnv(baseURL?: string) {
  return {
    [Product.NUCLEUM]: process.env.APP_BASE_URL_NUCLEUM?.trim() ?? baseURL,
    [Product.MEMOTRON]: process.env.APP_BASE_URL_MEMOTRON?.trim() ?? baseURL,
    [Product.POINTRON]: process.env.APP_BASE_URL_POINTRON?.trim() ?? baseURL
  } satisfies Partial<Record<ProjectKey, string | undefined>>;
}

async function assertRequestedAuthStateUsable(
  requestedProjects: ProjectKey[],
  baseUrls: Partial<Record<ProjectKey, string | undefined>>,
  authMode: E2EAuthMode
) {
  if (!isE2ECloudAuthMode(authMode)) return;
  if (process.env.E2E_VALIDATE_AUTH_STATE === "false") return;
  for (const project of requestedProjects) {
    const baseUrl = baseUrls[project];
    if (!baseUrl) continue;
    try {
      await assertProjectAuthStateUsable(project, baseUrl);
    } catch (error) {
      if (!canAutoRefreshAuthState()) {
        throw error;
      }
      setupWarn(
        `[e2e] Auth state for ${project} failed validation; refreshing with email auth.`
      );
      setupWarn(`[e2e] Validation error: ${(error as Error).message}`);
      await refreshProjectAuthState(project, baseUrl);
      await assertProjectAuthStateUsable(project, baseUrl);
    }
  }
}

function canAutoRefreshAuthState() {
  return Boolean(
    process.env.E2E_AUTO_REFRESH_AUTH_STATE !== "false" &&
      process.env.E2E_LOGIN_EMAIL?.trim() &&
      process.env.E2E_LOGIN_PASSWORD
  );
}

function refreshProjectAuthState(project: ProjectKey, baseURL: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["tsx", "scripts/save-email-auth-state.ts"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        PRODUCT: project,
        APP_BASE_URL: baseURL
      }
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Auth state refresh for ${project} exited with code ${String(code)}.`
        )
      );
    });
  });
}

async function assertProjectAuthStateUsable(
  project: ProjectKey,
  baseURL: string
) {
  const authPath = getAuthFilePath(project);
  const state = readStorageState(authPath);
  const expectedOrigin = new URL(baseURL).origin;
  const savedOrigins = state.origins?.map((origin) => origin.origin) ?? [];
  if (savedOrigins.length > 0 && !savedOrigins.includes(expectedOrigin)) {
    throw new Error(
      [
        `Playwright AuthFn storage state for ${project} was saved for ${savedOrigins.join(", ")} but tests are targeting ${expectedOrigin}.`,
        `Auth file: ${authPath}`,
        authRegenerationHint(project),
        "Set E2E_VALIDATE_AUTH_STATE=false only for intentionally unauthenticated runs."
      ].join(" ")
    );
  }

  const expectedCookieName = resolveExpectedSessionCookieName(baseURL);
  const expectedHost = resolveExpectedCookieHost(baseURL);
  const sessionCookies = (state.cookies ?? []).filter((cookie) =>
    cookie.name.includes(".session")
  );
  const sessionCookie = sessionCookies.find(
    (cookie) =>
      cookie.name === expectedCookieName &&
      isCookieDomainMatch(cookie.domain, expectedHost)
  );
  if (!sessionCookie) {
    throw new Error(
      [
        `Playwright AuthFn storage state for ${project} does not contain ${expectedCookieName} for ${expectedHost}.`,
        `Auth file: ${authPath}`,
        `Found session cookies: ${sessionCookies.map((cookie) => `${cookie.name}@${cookie.domain}`).join(", ") || "none"}.`,
        authRegenerationHint(project)
      ].join(" ")
    );
  }

  if (isCookieExpired(sessionCookie)) {
    throw new Error(
      [
        `Playwright AuthFn storage state for ${project} has an expired ${expectedCookieName} cookie.`,
        `Expired at: ${new Date(Number(sessionCookie.expires) * 1000).toISOString()}.`,
        `Auth file: ${authPath}`,
        authRegenerationHint(project)
      ].join(" ")
    );
  }

  if (expectedOrigin === "https://local.nucleum.app") {
    await assertLocalNucleumStorageStateSession(state, project, authPath);
  }
}

async function assertLocalNucleumStorageStateSession(
  state: StorageState,
  project: ProjectKey,
  authPath: string
) {
  const accountOrigin = "https://account-insouth-local.nucleum.app";
  const cookieHeader = cookieHeaderForHost(
    state,
    new URL(accountOrigin).hostname
  );
  const response = await requestText(`${accountOrigin}/auth/session`, {
    headers: {
      Cookie: cookieHeader
    }
  });
  let parsed: any = null;
  try {
    parsed = JSON.parse(response.body);
  } catch {
    parsed = null;
  }
  if (response.status !== 200 || !parsed?.data?.session) {
    throw new Error(
      [
        `Playwright AuthFn storage state for ${project} is not accepted by the local account service.`,
        `Auth file: ${authPath}`,
        `Observed /auth/session status ${response.status}.`,
        authRegenerationHint(project)
      ].join(" ")
    );
  }
}

function readStorageState(authPath: string): StorageState {
  try {
    return JSON.parse(fs.readFileSync(authPath, "utf-8")) as StorageState;
  } catch (error) {
    throw new Error(
      [
        `Unable to read Playwright AuthFn storage state at ${authPath}.`,
        `Error: ${(error as Error).message}`
      ].join(" ")
    );
  }
}

function authRegenerationHint(project: ProjectKey) {
  if (project === Product.NUCLEUM) {
    return "Regenerate it with: cd apps/e2e-playwright && npm run e2e:save-email-auth:nucleum";
  }
  return `Regenerate it with: cd apps/e2e-playwright && npm run e2e:save-email-auth:${project}`;
}

function resolveExpectedSessionCookieName(baseURL: string) {
  const prefix = resolveExpectedCookiePrefix(baseURL);
  const securePrefix = new URL(baseURL).protocol === "https:" ? "__Secure-" : "";
  return `${securePrefix}${prefix}.session`;
}

function resolveExpectedCookiePrefix(baseURL: string) {
  const host = new URL(baseURL).hostname.toLowerCase();
  const environment = resolveAccountEnvironmentFromHost(host);
  if (environment === "local") return "nucleus_local";
  if (environment === "pre") return "nucleus_pre";
  return "nucleus";
}

function resolveExpectedCookieHost(baseURL: string) {
  const host = new URL(baseURL).hostname.toLowerCase();
  if (host === "localhost" || netIsLoopback(host)) return host;
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return host;
  if (["local", "dev", "pre", "web", "app"].includes(labels[0])) {
    return labels.slice(1).join(".");
  }
  return labels.slice(-2).join(".");
}

function resolveAccountEnvironmentFromHost(host: string) {
  const subdomain = host.split(".")[0] ?? "";
  if (subdomain === "local" || host.endsWith(".localhost")) return "local";
  if (subdomain === "pre") return "pre";
  if (subdomain === "dev") return "dev";
  if (subdomain === "web" || subdomain === "app") return "live";
  const configured = (process.env.VITE_ENV ?? "").trim().toLowerCase();
  if (configured === "local" || configured === "pre" || configured === "live") {
    return configured;
  }
  return "dev";
}

function netIsLoopback(host: string) {
  return host === "127.0.0.1" || host === "0.0.0.0";
}

function isCookieDomainMatch(cookieDomain: string, host: string) {
  const normalized = cookieDomain.replace(/^\./, "").toLowerCase();
  return host === normalized || host.endsWith(`.${normalized}`);
}

function isCookieExpired(cookie: { expires?: number }) {
  if (!cookie.expires || cookie.expires < 0) return false;
  return Number(cookie.expires) <= Date.now() / 1000 + 60;
}

function cookieHeaderForHost(state: StorageState, host: string) {
  return (state.cookies ?? [])
    .filter((cookie) => isCookieDomainMatch(cookie.domain, host))
    .filter((cookie) => !isCookieExpired(cookie))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

export default async function globalSetup(config: FullConfig) {
  const authMode = resolveE2EAuthMode();
  const explicitBaseUrl = process.env.APP_BASE_URL?.trim();
  const perProjectUrl = getFirstPerProjectBaseUrl();
  const requestedProjectsFromArgv = getRequestedProjectsFromArgv();
  const requestedProjects =
    requestedProjectsFromArgv.length > 0
      ? requestedProjectsFromArgv
      : config.projects
          .map((project) => project.name)
          .filter(isProjectKey);
  setupLog(`Using E2E_AUTH_MODE=${authMode}`);
  assertAuthStateExists(requestedProjects, authMode);

  if (explicitBaseUrl) {
    setupLog(`Using APP_BASE_URL: ${explicitBaseUrl}`);
    (globalThis as any).__viteHarness = { close: async () => {} };
    if (isE2ECloudAuthMode(authMode)) {
      await warnAuthOriginMismatch(explicitBaseUrl);
    }
    await assertRequestedLocalAccountHealth(
      requestedProjects,
      {
        [Product.NUCLEUM]: explicitBaseUrl
      },
      authMode
    );
    await assertRequestedAuthStateUsable(
      requestedProjects,
      resolveProjectBaseUrlsFromEnv(explicitBaseUrl),
      authMode
    );
    return explicitBaseUrl;
  }

  const missingProjects = requestedProjects.filter(
    (project) => !getPerProjectBaseUrl(project)
  );

  if (perProjectUrl) {
    setupLog(
      `Using per-project base URLs from .env, for example ${perProjectUrl}.`
    );
    if (isE2ECloudAuthMode(authMode)) {
      await warnAuthOriginMismatch(perProjectUrl, {
        [Product.NUCLEUM]: process.env.APP_BASE_URL_NUCLEUM?.trim(),
        [Product.MEMOTRON]: process.env.APP_BASE_URL_MEMOTRON?.trim(),
        [Product.POINTRON]: process.env.APP_BASE_URL_POINTRON?.trim()
      });
    }
    await assertRequestedLocalAccountHealth(
      requestedProjects,
      {
        [Product.NUCLEUM]: process.env.APP_BASE_URL_NUCLEUM?.trim(),
        [Product.MEMOTRON]: process.env.APP_BASE_URL_MEMOTRON?.trim(),
        [Product.POINTRON]: process.env.APP_BASE_URL_POINTRON?.trim()
      },
      authMode
    );
    if (areAllPerProjectBaseUrlsSet() || missingProjects.length === 0) {
      (globalThis as any).__viteHarness = { close: async () => {} };
      await assertRequestedAuthStateUsable(
        requestedProjects,
        resolveProjectBaseUrlsFromEnv(perProjectUrl),
        authMode
      );
      return requestedProjects[0]
        ? (getPerProjectBaseUrl(requestedProjects[0]) ?? perProjectUrl)
        : perProjectUrl;
    }
    setupLog(
      "Only some per-project base URLs are set; starting local dev server for remaining requested projects."
    );
  }

  if (missingProjects.length > 1) {
    const harnesses: ViteHarness[] = [];
    for (const project of missingProjects) {
      const app = projectAppMap[project];
      setupLog(`Starting Vite server for ${app}...`);
      const harness = await startVite(app);
      harnesses.push(harness);
      setPerProjectBaseUrl(project, harness.url);
      setupLog(`Set ${project} base URL to ${harness.url}`);
    }
    for (const harness of harnesses) {
      await warmUpViteUrl(harness.url);
    }
    (globalThis as any).__viteHarnesses = harnesses;
    (globalThis as any).__viteHarness = {
      close: async () => {
        await Promise.all(harnesses.map((harness) => harness.close()));
      }
    };
    await assertRequestedAuthStateUsable(
      requestedProjects,
      resolveProjectBaseUrlsFromEnv(getPerProjectBaseUrl(missingProjects[0])),
      authMode
    );
    return getPerProjectBaseUrl(missingProjects[0]) ?? defaultBaseURL;
  }

  const targetProject =
    missingProjects[0] ??
    requestedProjects[0] ??
    ((process.env.PLAYWRIGHT_APP === "apps/memotron"
      ? Product.MEMOTRON
      : process.env.PLAYWRIGHT_APP === "apps/pointron"
        ? Product.POINTRON
        : Product.NUCLEUM) as ProjectKey);
  const targetApp = process.env.PLAYWRIGHT_APP ?? projectAppMap[targetProject];
  setupLog(`Starting Vite server for ${targetApp}...`);
  const harness = await startVite(targetApp);
  process.env.APP_BASE_URL = harness.url;
  setPerProjectBaseUrl(targetProject, harness.url);
  setupLog(`Set APP_BASE_URL to ${harness.url}`);
  await warmUpViteUrl(harness.url);
  (globalThis as any).__viteHarness = harness;
  await assertRequestedAuthStateUsable(
    requestedProjects,
    resolveProjectBaseUrlsFromEnv(harness.url),
    authMode
  );
  return harness.url;
}

async function warnAuthOriginMismatch(
  baseURL: string,
  perProjectBaseUrls?: Partial<
    Record<ProjectKey, string | undefined>
  >
) {
  const authDir = path.join(__dirname, ".auth");
  const authFiles: Array<{ file: string; expectedBaseUrl?: string }> = [
    {
      file: "user.json",
      expectedBaseUrl: perProjectBaseUrls?.[Product.NUCLEUM] ?? baseURL
    },
    {
      file: "user-memotron.json",
      expectedBaseUrl: perProjectBaseUrls?.[Product.MEMOTRON] ?? baseURL
    },
    {
      file: "user-pointron.json",
      expectedBaseUrl: perProjectBaseUrls?.[Product.POINTRON] ?? baseURL
    }
  ];
  try {
    for (const { file, expectedBaseUrl } of authFiles) {
      if (!expectedBaseUrl) continue;
      const currentOrigin = new URL(expectedBaseUrl).origin;
      const authPath = path.join(authDir, file);
      if (fs.existsSync(authPath)) {
        const raw = fs.readFileSync(authPath, "utf-8");
        const state = JSON.parse(raw) as {
          origins?: Array<{ origin: string }>;
        };
        const savedOrigins = state.origins?.map((o) => o.origin) ?? [];
        if (savedOrigins.length > 0 && !savedOrigins.includes(currentOrigin)) {
          setupWarn(
            `\n⚠️  Auth in ${file} was saved for origin(s): ${savedOrigins.join(", ")} but expected base URL is ${expectedBaseUrl}.`,
            `\n   Set APP_BASE_URL_<PROJECT> in .env to match (e.g. APP_BASE_URL_MEMOTRON=${savedOrigins[0]}).\n`
          );
        }
      }
    }
  } catch (err) {
    setupWarn("[e2e] Could not check auth origin vs APP_BASE_URL:", err);
  }
}
