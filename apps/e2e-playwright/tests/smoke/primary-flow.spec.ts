import { expect, test, type Page } from "@playwright/test";
import { Product } from "@21n/types/product.type";
import {
  ensureInAppOnHome,
  LibraryTab,
  openLibraryAndTab,
  runCommand
} from "../utils/helpers";
import { readResourcesByLabel } from "../focus/active-session/session-test-support";
import { getResourceThumbnail } from "../utils/resource-matrix";

async function runNucleusSmokeFlow(page: Page) {
  const taskName = `E2E smoke task ${Date.now()}`;

  await openLibraryAndTab(page, LibraryTab.Tasks);
  await page
    .getByRole("button", { name: /^(New task|Create task)(\s|$)/i })
    .first()
    .click({ timeout: 10_000 });
  const taskNameInput = page.getByTestId("task-name-input");
  await taskNameInput.waitFor({ state: "visible", timeout: 15_000 });
  await taskNameInput.fill(taskName);
  await page.keyboard.press("Enter");
  await taskNameInput
    .waitFor({ state: "hidden", timeout: 10_000 })
    .catch(() => null);

  await expect
    .poll(
      async () => (await readResourcesByLabel(page, "task", taskName)).length,
      { message: "runNucleusSmokeFlow: toBe 1" }
    )
    .toBe(1);
  const createdTask = (await readResourcesByLabel(page, "task", taskName))[0];

  await expect(getResourceThumbnail(page, createdTask.id)).toBeVisible({
    timeout: 15_000
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openLibraryAndTab(page, LibraryTab.Tasks);
  await expect(getResourceThumbnail(page, createdTask.id)).toBeVisible({
    timeout: 15_000
  });
}

async function runPointronSmokeFlow(page: Page) {
  const objectiveName = `E2E smoke objective ${Date.now()}`;

  await runCommand(page, "Create a new objective");
  const objectiveNameInput = page.getByTestId("objective-name-input");
  await objectiveNameInput.waitFor({ state: "visible", timeout: 15_000 });
  await objectiveNameInput.fill(objectiveName);
  await page.keyboard.press("Enter");
  await objectiveNameInput
    .waitFor({ state: "hidden", timeout: 10_000 })
    .catch(() => null);

  const objectiveRecord = page.getByTestId("resource-record-surface");
  await expect(objectiveRecord).toBeVisible({ timeout: 15_000 });
  await expect(
    objectiveRecord.getByText(objectiveName, { exact: true }).first()
  ).toBeVisible({ timeout: 15_000 });

  await expect
    .poll(
      async () =>
        (await readResourcesByLabel(page, "objective", objectiveName)).length,
      { message: "runPointronSmokeFlow: toBe 1" }
    )
    .toBe(1);
  const createdObjective = (
    await readResourcesByLabel(page, "objective", objectiveName)
  )[0];

  await objectiveRecord
    .getByRole("button", { name: /^Close$/i })
    .first()
    .click({ timeout: 5_000 });
  await openLibraryAndTab(page, LibraryTab.Objectives);
  await expect(getResourceThumbnail(page, createdObjective.id)).toBeVisible({
    timeout: 15_000
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openLibraryAndTab(page, LibraryTab.Objectives);
  await expect(getResourceThumbnail(page, createdObjective.id)).toBeVisible({
    timeout: 15_000
  });
}

async function runMemotronSmokeFlow(page: import("@playwright/test").Page) {
  const nodeText = `E2E smoke node ${Date.now()}`;

  await runCommand(page, "Capture");

  const editor = page
    .getByTestId("capture-editor")
    .getByPlaceholder("Start typing to capture...")
    .or(
      page
        .getByTestId("capture-editor")
        .getByRole("textbox", { name: /Markdown editor|Start typing/i })
    )
    .first();
  const markdownBtn = page.getByRole("button", { name: /^Markdown$/i }).first();
  const editorVisible = await editor.isVisible().catch(() => false);
  if (!editorVisible) {
    await markdownBtn.click({ timeout: 5_000 });
  }

  await editor.waitFor({ state: "visible", timeout: 8_000 });
  await editor.click();
  await page.keyboard.type(nodeText, { delay: 50 });

  const saveBtn = page
    .getByTestId("capture-save-button")
    .or(page.getByRole("button", { name: /^Save$/i }));
  await saveBtn.first().click({ timeout: 5_000 });

  const recordSurface = page.getByTestId("resource-record-surface");
  await expect(recordSurface).toBeVisible({ timeout: 15_000 });
  await expect(
    recordSurface.getByText(nodeText, { exact: true }).first()
  ).toBeVisible({ timeout: 15_000 });

  const closeBtn = recordSurface.getByRole("button", { name: "Close" });
  await closeBtn.click({ timeout: 5_000 });

  await openLibraryAndTab(page, LibraryTab.Nodes);
  await expect(page.getByText(nodeText, { exact: false }).first()).toBeVisible({
    timeout: 15_000
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openLibraryAndTab(page, LibraryTab.Nodes);
  await expect(page.getByText(nodeText, { exact: false }).first()).toBeVisible({
    timeout: 15_000
  });
}

test.describe("primary flow smoke @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/*", (route) => {
      const reqUrl = route.request().url();
      if (/accounts\.google\.com/i.test(reqUrl)) {
        route.abort();
        return;
      }
      route.continue();
    });
  });

  test("core create or open flow works for the current product", async ({
    page
  }, testInfo) => {
    test.setTimeout(90_000);
    await ensureInAppOnHome(page);

    if (testInfo.project.name === Product.MEMOTRON) {
      await runMemotronSmokeFlow(page);
      return;
    }

    if (testInfo.project.name === Product.POINTRON) {
      await runPointronSmokeFlow(page);
      return;
    }

    await runNucleusSmokeFlow(page);
  });
});
