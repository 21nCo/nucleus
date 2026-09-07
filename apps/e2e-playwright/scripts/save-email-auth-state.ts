/**
 * One-time save: log in with E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD, then save session.
 * Tests can use the saved session via storageState so they don't log in every time.
 *
 * Requires in .env (or env): E2E_LOGIN_EMAIL, E2E_LOGIN_PASSWORD, and APP_BASE_URL (or APP_BASE_URL_<PROJECT>).
 *
 * Run:
 *   Nucleum:  npm run e2e:save-email-auth:nucleum   (or PRODUCT=nucleum APP_BASE_URL=... npm run e2e:save-email-auth)
 *   Memotron: npm run e2e:save-email-auth:memotron
 *   Pointron: npm run e2e:save-email-auth:pointron
 */

import "dotenv/config";
import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import net from "node:net";
import { Product } from "@21n/types/product.type";

const authDir = path.join(__dirname, "..", ".auth");
const artifactsDir = path.join(__dirname, "..", "artifacts");
const product = (process.env.PRODUCT ?? Product.NUCLEUM).toLowerCase();
const authFileName =
  product === Product.NUCLEUM ? "user.json" : `user-${product}.json`;
const authStatePath = path.join(authDir, authFileName);

function getBaseURL(): string {
  // Match playwright.config.ts precedence: product-specific env first, then APP_BASE_URL, then fallback.
  const fallback = "http://127.0.0.1:4173";
  if (product === Product.NUCLEUM) {
    return (
      process.env.APP_BASE_URL_NUCLEUM ??
      process.env.APP_BASE_URL ??
      fallback
    );
  }
  const envKey = `APP_BASE_URL_${product.toUpperCase()}`;
  return process.env[envKey] ?? process.env.APP_BASE_URL ?? fallback;
}

function resolveAccountBaseUrl(appBaseUrl: string, region: string) {
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

async function main() {
  const email = process.env.E2E_LOGIN_EMAIL?.trim();
  const password = process.env.E2E_LOGIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD must be set in .env or environment."
    );
  }

  const baseURL = getBaseURL();
  const forcedAuthRegion =
    process.env.E2E_AUTH_REGION?.trim() ||
    (new URL(baseURL).hostname.startsWith("local.") ? "insouth" : "");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  console.log("Product:", product);
  console.log("Base URL:", baseURL);
  console.log("Auth will be saved to:", authStatePath);
  console.log("Logging in with email/password and saving session...\n");

  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== "false",
    channel: "chrome",
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
  });

  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1512, height: 982 },
    // Local dev uses Caddy's `tls internal` certs; Playwright's bundled Chromium may not honor the OS trust store.
    // Keep this enabled so the auth-save script can run in CI/local HTTPS environments without flaking.
    ignoreHTTPSErrors: true,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();
  const hostname = new URL(baseURL).hostname;
  const parentDomain =
    net.isIP(hostname) !== 0 || hostname === "localhost"
      ? hostname
      : hostname.includes(".")
        ? hostname.split(".").slice(-2).join(".")
        : hostname; // e.g. local.nucleum.app -> nucleum.app
  const legacySessionCookieName = "__Secure-21n.session_token";

  try {
    const logStep = (message: string) => {
      console.log(`[auth-save][step] ${message}`);
    };

    if (forcedAuthRegion) {
      await page.addInitScript(
        ({ region, email }) => {
          window.localStorage.setItem("region", region);
          const existing = window.localStorage.getItem("userRegionMap");
          let parsed: Record<string, string> = {};
          try {
            parsed = existing ? JSON.parse(existing) : {};
          } catch {
            parsed = {};
          }
          if (email) parsed[email] = region;
          window.localStorage.setItem("userRegionMap", JSON.stringify(parsed));
        },
        { region: forcedAuthRegion, email }
      );
      logStep(`forcing auth region to ${forcedAuthRegion}`);
    }

    page.on("console", (msg) => {
      console.log(`[auth-save][console.${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.log(`[auth-save][pageerror] ${err.message}`);
    });
    page.on("requestfailed", (req) => {
      const url = req.url();
      if (/account|login|signup|auth/i.test(url)) {
        console.log(
          `[auth-save][requestfailed] ${req.method()} ${url} ${req.failure()?.errorText ?? ""}`
        );
      }
    });

    const dumpDebugState = async (label: string) => {
      const screenshotPath = path.join(
        artifactsDir,
        `auth-save-${label.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.png`
      );
      const visibleButtons = await page
        .locator("button")
        .evaluateAll((els) =>
          els
            .map((el) => ({
              text: (el.textContent ?? "").trim().replace(/\s+/g, " "),
              ariaLabel: el.getAttribute("aria-label"),
              disabled: (el as HTMLButtonElement).disabled
            }))
            .filter((x) => x.text || x.ariaLabel)
        )
        .catch(() => []);
      const localStorageEntries = await page
        .evaluate(() => Object.entries(window.localStorage))
        .catch(() => []);
      const cookies = await context.cookies().catch(() => []);
      console.log(`[auth-save][debug:${label}] url=${page.url()}`);
      console.log(
        `[auth-save][debug:${label}] buttons=${JSON.stringify(visibleButtons)}`
      );
      console.log(
        `[auth-save][debug:${label}] localStorage=${JSON.stringify(localStorageEntries)}`
      );
      console.log(
        `[auth-save][debug:${label}] cookies=${JSON.stringify(
          cookies.map((c) => ({ name: c.name, domain: c.domain }))
        )}`
      );
      await page
        .screenshot({ path: screenshotPath, fullPage: true })
        .catch(() => null);
      console.log(`[auth-save][debug:${label}] screenshot=${screenshotPath}`);
    };

    const logInTab = page
      .getByRole("tab", { name: /^Log in$/i })
      .or(page.getByRole("button", { name: /^Log in$/i }))
      .first();
    const emailInput = page
      .getByPlaceholder("username@email.com")
      .or(page.getByLabel("Email"));
    const enterPasswordBtn = page.getByRole("button", {
      name: /Enter password/i
    });
    const googleButton = page
      .getByRole("button", { name: /Continue with Google/i })
      .first();
    const passwordInput = page.locator("#password");

    const isLoginSurfaceVisible = async (timeout: number) => {
      const locators = [
        logInTab,
        emailInput.first(),
        enterPasswordBtn.first(),
        googleButton
      ];
      for (const locator of locators) {
        const visible = await locator
          .waitFor({ state: "visible", timeout })
          .then(() => true)
          .catch(() => false);
        if (visible) return true;
      }
      return false;
    };

    const openLoginSurface = async () => {
      logStep("opening /account/login");
      await page.goto("/account/login", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2_000); // let SPA and auth check settle

      if (await isLoginSurfaceVisible(20_000)) {
        logStep(`login surface detected directly at ${page.url()}`);
        return;
      }

      logStep("login surface not ready; trying / then Login/Signup button");
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2_000);

      const loginSignupBtn = page
        .getByRole("button", {
          name: /login|signup/i
        })
        .first();
      const hasLoginBtn = await loginSignupBtn
        .waitFor({ state: "visible", timeout: 15_000 })
        .then(() => true)
        .catch(() => false);
      if (hasLoginBtn) {
        for (let i = 0; i < 5; i += 1) {
          logStep(`clicking Login/Signup button attempt ${i + 1}`);
          await loginSignupBtn.scrollIntoViewIfNeeded().catch(() => null);
          await loginSignupBtn
            .click({ timeout: 10_000, force: true })
            .catch(() => null);
          const loginUiReady = await isLoginSurfaceVisible(5_000);
          const reachedLoginPath = /\/account\/login/.test(
            new URL(page.url()).pathname
          );
          if (loginUiReady || reachedLoginPath) {
            logStep(
              `login surface became reachable after Login/Signup click; url=${page.url()}`
            );
            return;
          }
          await page.waitForTimeout(800);
        }
      }

      logStep("falling back to /signup to find login surface");
      await page.goto("/signup", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1_000);
      if (await isLoginSurfaceVisible(10_000)) {
        logStep(`login surface detected from /signup at ${page.url()}`);
        return;
      }

      await dumpDebugState("could-not-reach-login-surface");
      throw new Error(
        `Could not reach the login surface. Landed on ${new URL(page.url()).pathname}.`
      );
    };

    await openLoginSurface();

    await page.waitForTimeout(1_000); // let login form render

    if (forcedAuthRegion) {
      logStep(`auth region override active: ${forcedAuthRegion}`);
    }

    // Click "Log in" tab (BoxSwitcher option), then fill email and password
    logStep(`waiting for Log in tab on ${page.url()}`);
    await logInTab.waitFor({ state: "visible", timeout: 15_000 });
    logStep("clicking Log in tab");
    await logInTab.click({ timeout: 10_000 });
    await page.waitForTimeout(800);

    logStep("waiting for email input");
    const emailVisible = await emailInput
      .waitFor({ state: "visible", timeout: 12_000 })
      .then(() => true)
      .catch(() => false);
    if (!emailVisible) {
      throw new Error(
        "Email input did not appear. Is email/password login enabled for this app?"
      );
    }
    logStep(`filling email for ${email}`);
    await emailInput.fill(email);
    await page.waitForTimeout(300);

    // Some builds show an explicit "Enter password" button, others show the password field directly.
    logStep("checking whether Enter password button is present");
    const haveEnterPassword = await enterPasswordBtn
      .first()
      .waitFor({ state: "visible", timeout: 7_500 })
      .then(() => true)
      .catch(() => false);
    if (haveEnterPassword) {
      logStep("clicking Enter password");
      await enterPasswordBtn
        .first()
        .click({ timeout: 10_000 })
        .catch(() => null);
      await page.waitForTimeout(500);
    } else {
      logStep(
        "Enter password button not shown; password input expected directly"
      );
    }

    logStep("waiting for password input");
    await passwordInput.waitFor({ state: "visible", timeout: 10_000 });
    logStep("filling password");
    await passwordInput.fill(password);
    await page.waitForTimeout(300);

    // Wait for the auth API response so the session cookie is applied before we save.
    const isAccountRelated = (url: string) => {
      try {
        const u = new URL(url);
        return (
          u.pathname.startsWith("/account") ||
          /(^|\.)account\./i.test(u.hostname)
        );
      } catch {
        return /account/i.test(url);
      }
    };
    const responsePromise = page
      .waitForResponse((res) => isAccountRelated(res.url()), {
        timeout: 25_000
      })
      .catch(() => null);

    // Wait for response that sets session cookie. Playwright's response.headers() does NOT expose Set-Cookie,
    // so use allHeaders() which includes it.
    const sessionCookiePromise = page
      .waitForResponse(
        async (res) => {
          const h = await res.allHeaders();
          const setCookie = h["set-cookie"] ?? h["Set-Cookie"];
          const value = Array.isArray(setCookie)
            ? setCookie.join(" ")
            : setCookie;
          return (
            typeof value === "string" &&
            /session_token|session_data|__Secure-[^=]+\.session|(^|;\s*)[^=]+\.session=/i.test(
              value
            )
          );
        },
        { timeout: 25_000 }
      )
      .catch(() => null);

    const hasSessionCookie = async () => {
      const cookies = await context.cookies();
      return cookies.some((c) => {
        if (c.expires > 0 && c.expires <= Date.now() / 1000 + 60) {
          return false;
        }
        const isSessionCookie =
          c.name === legacySessionCookieName ||
          c.name?.includes("session_token") ||
          c.name === "__Secure-nucleus.session" ||
          c.name === "nucleus.session" ||
          c.name?.endsWith(".session");
        if (!isSessionCookie) return false;
        return (
          c.domain === parentDomain ||
          c.domain === `.${parentDomain}` ||
          c.domain.endsWith(".nucleum.app") ||
          c.domain === "nucleum.app"
        );
      });
    };

    const hasAuthFnBrowserSession = async () => {
      const accountBaseUrl = resolveAccountBaseUrl(
        baseURL,
        forcedAuthRegion || "insouth"
      );
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

    // Avoid clicking the "Log in" tab again; target the form submit button.
    const submitBtn = page
      .locator('form button[type="submit"]', { hasText: /^Log in$/i })
      .first()
      .or(page.getByRole("button", { name: /^Log in$/i }).last());
    logStep(`clicking final Log in submit on ${page.url()}`);
    await submitBtn.click({ timeout: 10_000 });

    logStep("waiting for auth-related response and session cookie response");
    await responsePromise;
    await sessionCookiePromise;

    const authDeadline = Date.now() + 40_000;
    let leftLogin = false;
    while (Date.now() < authDeadline) {
      const pathname = new URL(page.url()).pathname;
      if (pathname !== "/account/login") {
        logStep(`left /account/login and reached ${pathname}`);
        leftLogin = true;
        break;
      }
      if (await hasSessionCookie()) {
        logStep("session cookie detected while still on /account/login");
        break;
      }
      await page.waitForTimeout(500);
    }

    if (
      !leftLogin &&
      ((await hasSessionCookie()) || (await hasAuthFnBrowserSession()))
    ) {
      logStep("forcing navigation to / after auth session detection");
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("domcontentloaded");
      leftLogin = new URL(page.url()).pathname !== "/account/login";
      logStep(`after forced navigation current url=${page.url()}`);
    }

    if (!leftLogin) {
      await dumpDebugState("login-did-not-complete");
      throw new Error(
        "Login did not complete (still on login page). Check credentials and app."
      );
    }

    logStep(`post-login path is ${new URL(page.url()).pathname}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle").catch(() => null);
    await page.waitForTimeout(2_000);

    // Save the state exactly where login lands (typically /signup for this flow).
    // Tests will handle the follow-up "Continue offline" step.
    logStep(
      `preserving post-login landing page at ${new URL(page.url()).pathname}`
    );

    // Browser auth must be represented by cookies. A bearer token in localStorage is only valid
    // for explicit native/extension bridge paths and should not make web E2E state look logged in.
    const deadline = Date.now() + 15_000;
    let hasSavedAuthSession = false;
    while (Date.now() < deadline) {
      const hasSession = await hasSessionCookie();
      const hasBrowserSession = hasSession && (await hasAuthFnBrowserSession());
      if (hasBrowserSession) {
        logStep("confirmed AuthFn session in browser context");
        hasSavedAuthSession = true;
        break;
      }
      await page.waitForTimeout(500);
    }

    if (!hasSavedAuthSession) {
      await dumpDebugState("auth-session-not-detected");
      throw new Error(
        "AuthFn session was not detected; refusing to save unauthenticated storageState."
      );
    }

    // Save after login success so session cookie is in context. Do NOT click "Continue offline" — tests will do that.
    await context.storageState({ path: authStatePath, indexedDB: true });
    console.log("Session saved to", authStatePath);
    console.log("Run tests with: npx playwright test --project=" + product);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
