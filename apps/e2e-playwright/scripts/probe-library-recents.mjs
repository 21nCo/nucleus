import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const root = process.cwd();
const artifacts = `${root}/apps/e2e-playwright/artifacts/recents-boundary-${Date.now()}`;
await fs.mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1512, height: 982 }
});
await context.addInitScript(() => {
  performance.setResourceTimingBufferSize(10000);
  localStorage.setItem(
    "offlineSessionId",
    localStorage.getItem("offlineSessionId") ?? crypto.randomUUID()
  );
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) =>
  errors.push({ message: e.message, stack: e.stack })
);
const label = `Recent boundary ${Date.now()}`;
try {
  await page.goto("https://local.nucleum.app/", { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Library", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Nodes", exact: true }).first()
  ).toBeVisible({ timeout: 20000 });
  await page.setViewportSize({ width: 780, height: 982 });
  await expect(page.getByText("Recents", { exact: true })).toBeVisible();
  await page.evaluate(
    async ({ root, label }) => {
      const loaded = (name) => {
        const url = performance
          .getEntriesByType("resource")
          .find(
            (e) => new URL(e.name).pathname === `/@fs${root}/client/${name}.ts`
          )?.name;
        if (!url) throw new Error(`Live module missing: ${name}`);
        return import(url);
      };
      const { datafn } = await loaded("datafn/datafn.store");
      const id = `node:recent_boundary_${Date.now()}`;
      await datafn.node.mutate({
        operation: "insert",
        id,
        record: {
          id,
          label,
          body: "",
          contentType: "NODULAR_MARKDOWN",
          mdChildOrder: [],
          metaType: "",
          text: ""
        }
      });
      const { recentsStore } = await loaded("stores/resources/recent.store");
      await recentsStore.refresh(["everything"]);
    },
    { root, label }
  );
  await expect(page.getByText(label, { exact: true }).first()).toBeVisible({
    timeout: 20000
  });
  await page.screenshot({ path: `${artifacts}/visible.png` });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Recents", { exact: true })).toBeVisible();
  await expect(page.getByText(label, { exact: true }).first()).toBeVisible({
    timeout: 20000
  });
  await page.screenshot({ path: `${artifacts}/reloaded.png` });
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ artifacts, passed: true, errors }));
  await fs.writeFile(
    `${artifacts}/result.json`,
    JSON.stringify({ passed: true, errors })
  );
} catch (error) {
  await fs.writeFile(`${artifacts}/failure.html`, await page.content());
  console.error(
    JSON.stringify({ artifacts, error: String(error), url: page.url(), errors })
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
