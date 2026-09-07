import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const baseURL = process.env.APP_BASE_URL ?? "https://local.nucleum.app";
const artifacts = path.join(
  repoRoot,
  "apps/e2e-playwright/artifacts",
  `review-session-${Date.now()}`
);
const sessionPath = `/@fs${repoRoot}/client/features/focus/session.store.ts`;
const datafnPath = `/@fs${repoRoot}/client/datafn/datafn.store.ts`;
const modalPath = `/@fs${repoRoot}/client/stores/overlays/modal.store.ts`;
const errors = [];
const results = [];
await fs.mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  baseURL,
  ignoreHTTPSErrors: true,
  permissions: ["notifications"],
  viewport: { width: 1512, height: 982 }
});
await context.addInitScript(() => {
  performance.setResourceTimingBufferSize(10000);
  if (!localStorage.getItem("offlineSessionId")) {
    localStorage.setItem("offlineSessionId", crypto.randomUUID());
  }
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(30000);
page.on("pageerror", (error) => errors.push(error.message));
const fullscreen = page.locator('[id="FULL_SCREEN_FOCUS-focus"]');

/** Uses the app's loaded module, including Vite's HMR timestamp. */
async function liveModulePath(modulePath) {
  return page.evaluate((modulePath) => {
    const loaded = performance
      .getEntriesByType("resource")
      .find((entry) => new URL(entry.name).pathname === modulePath);
    if (!loaded)
      throw new Error(
        `App has not loaded ${modulePath}: ${performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => name.includes("session.store"))}`
      );
    return loaded.name;
  }, modulePath);
}

/** Records visible evidence for each regression check. */
async function step(name, run) {
  console.log(`Checking ${name}`);
  try {
    await run();
    await page.screenshot({ path: path.join(artifacts, `${name}.png`) });
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
    await fs.writeFile(
      path.join(artifacts, `${name}.html`),
      await page.content()
    );
    await page.screenshot({ path: path.join(artifacts, `${name}.png`) });
    throw error;
  }
}

try {
  await page.goto("/", { waitUntil: "networkidle" });
  await step("start-focus", async () => {
    await page
      .getByRole("button", { name: /^Focus$/i })
      .first()
      .click();
    await page.getByText("Advanced", { exact: true }).first().click();
    await page
      .getByRole("button", { name: /Start focus/i })
      .first()
      .click();
    await expect(fullscreen).toBeVisible();
    await expect(
      fullscreen.getByRole("button", { name: /Finish/i }).first()
    ).toBeVisible();
    await expect
      .poll(
        async () =>
          page.evaluate(
            async (p) => {
              const { datafn } = await import(p);
              return (await datafn.kv.get("pointSessionSnapshotv2"))
                ?.isSessionRunning;
            },
            await liveModulePath(datafnPath)
          ),
        { message: "started session is durably saved" }
      )
      .toBe(true);
  });

  await step("reload-fullscreen", async () => {
    await page.reload({ waitUntil: "networkidle" });
    await expect(fullscreen).toBeVisible();
    await expect(
      fullscreen.getByRole("button", { name: /Finish/i }).first()
    ).toBeVisible();
    const loadedModalPath = await liveModulePath(modalPath);
    await expect
      .poll(
        () =>
          page.evaluate(
            async (p) => (await import(p)).fullScreen.get().path,
            loadedModalPath
          ),
        { message: "fullscreen store restores the URL state" }
      )
      .toBe("FULL_SCREEN_FOCUS");
    const exitFullscreen = fullscreen.getByRole("button").last();
    await exitFullscreen.hover();
    await expect(
      page.getByText("Exit full screen", { exact: true })
    ).toBeVisible();
    await exitFullscreen.click();
    await expect(fullscreen).toBeHidden();
    await expect(page).not.toHaveURL(/full=FULL_SCREEN_FOCUS/);
  });

  await step("interval-boundary", async () => {
    const state = await page.evaluate(
      async (p) => {
        const { activeSession } = await import(p);
        const now = Date.now();
        const saved = activeSession.get();
        await activeSession.loader({
          ...saved,
          type: "PREDEFINED_INTERVALS",
          state: 1,
          isSessionRunning: true,
          start: new Date(now - 60000),
          end: new Date(now + 120000),
          plannedDuration: 180,
          totalIdle: 0,
          currentBlockId: "probe-first",
          intervals: [
            {
              id: "probe-first",
              start: now - 60000,
              duration: 60,
              type: 1,
              progress: 0
            },
            {
              id: "probe-break",
              start: now,
              duration: 60,
              type: 0,
              progress: 0
            },
            {
              id: "probe-last",
              start: now + 60000,
              duration: 60,
              type: 1,
              progress: 0
            }
          ]
        });
        return {
          block: activeSession.get().currentBlockId,
          running: activeSession.get().isSessionRunning
        };
      },
      await liveModulePath(sessionPath)
    );
    expect(state).toEqual({ block: "probe-break", running: true });
    await expect(
      page.getByRole("button", { name: /^\d{2}:\d{2}(?::\d{2})?$/ }).last()
    ).toBeVisible();
  });

  await step("delivered-reset", async () => {
    await page.evaluate(
      async ({ sessionPath, datafnPath }) => {
        const { activeSession } = await import(sessionPath);
        const { datafn } = await import(datafnPath);
        const saved = activeSession.get();
        await datafn.kv.set("pointSessionSnapshotv2", {
          ...saved,
          currentSessionId: undefined,
          isSessionRunning: false,
          state: 0
        });
      },
      {
        sessionPath: await liveModulePath(sessionPath),
        datafnPath: await liveModulePath(datafnPath)
      }
    );
    const loadedSessionPath = await liveModulePath(sessionPath);
    await expect
      .poll(
        () =>
          page.evaluate(
            async (p) => (await import(p)).activeSession.get().isSessionRunning,
            loadedSessionPath
          ),
        { message: "delivered idle snapshot stops the active session" }
      )
      .toBe(false);
    await expect(
      page.getByRole("button", { name: /^Focus$/i }).first()
    ).toBeVisible();
    await expect(fullscreen).toBeHidden();
    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page.getByRole("button", { name: /^Focus$/i }).first()
    ).toBeVisible();
    await expect(fullscreen).toBeHidden();
  });
  expect(errors).toEqual([]);
} catch (error) {
  process.exitCode = 1;
  console.error(String(error));
} finally {
  await fs.writeFile(
    path.join(artifacts, "result.json"),
    JSON.stringify({ baseURL, results, errors }, null, 2)
  );
  console.log(JSON.stringify({ artifacts, results, errors }, null, 2));
  await browser.close();
}
