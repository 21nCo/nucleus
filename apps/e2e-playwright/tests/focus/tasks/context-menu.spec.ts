import type { Page } from "@playwright/test";
import { expect, test, type E2ESeed } from "../../fixtures/e2e-test";
import { ResourceActionType } from "@nucleum/datafn/resource.type";
import { ensureInAppOnHome } from "../../utils/helpers";
import {
  getResourceContextMenuTrigger,
  getResourceRecordContextMenuTrigger,
  getResourceRecordSurface,
  getResourceThumbnail,
  getResourceThumbnails,
  requireResourceBrowseContract
} from "../../utils/resource-matrix";
import {
  blockGoogleAccountsNavigation,
  openTaskLibrary
} from "../focus-test-helpers";
import { openTaskRecord } from "./task-test-helpers";

let e2eSeed: E2ESeed;

async function expectContextMenuItems(page: Page, itemIds: readonly string[]) {
  for (const value of itemIds) {
    await expect(
      page.locator(`[data-context-menu-item-id="${value}"]`).first()
    ).toBeVisible({ timeout: 8_000 });
  }
}

test.beforeEach(async ({ page, seed }) => {
  e2eSeed = seed;
  await blockGoogleAccountsNavigation(page);
});

async function resolveTaskRowFromLibrary(page: Page, taskId: string) {
  await openTaskLibrary(page);
  const row = getResourceThumbnail(page, taskId);
  await expect(row).toBeVisible({ timeout: 20_000 });
  return row;
}

async function openThumbnailContextMenu(
  page: Page,
  thumbnail: ReturnType<Page["locator"]>
) {
  await thumbnail.scrollIntoViewIfNeeded();
  await thumbnail.hover();
  const trigger = getResourceContextMenuTrigger(thumbnail);
  await expect(trigger).toBeVisible({ timeout: 5_000 });
  await trigger.click({ timeout: 5_000 });
}

async function openTaskContextMenuFromLibrary(page: Page, taskId: string) {
  const list = await resolveTaskRowFromLibrary(page, taskId);
  await openThumbnailContextMenu(page, list);
}

async function getTaskLibraryThumbnails(page: Page) {
  const thumbnails = getResourceThumbnails(page);
  await expect(thumbnails.first()).toBeVisible({ timeout: 20_000 });
  const count = await thumbnails.count();
  expect(
    count,
    "Task context menu lifecycle tests need at least two task thumbnails"
  ).toBeGreaterThanOrEqual(2);
  return thumbnails;
}

test("from library - thumbnail context menu closes when pointer leaves task row @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const taskName = `E2E task ctx close ${Date.now()}`;
  const task = await e2eSeed.focus.task({ label: taskName });
  const taskRow = await resolveTaskRowFromLibrary(page, task.id);
  await openThumbnailContextMenu(page, taskRow);

  await expect(
    page.locator(".popover").getByRole("button", { name: /^Select$/i })
  ).toBeVisible({ timeout: 8_000 });

  await page.mouse.move(1, 1);

  await expect(page.locator(".popover")).toHaveCount(0, { timeout: 8_000 });
  await expect(
    taskRow.getByTestId("thumbnail-context-menu-trigger")
  ).toHaveCount(0);
});

test("from library - second task thumbnail can open context menu after first menu was open @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  await e2eSeed.focus.task({
    label: `E2E task ctx first ${Date.now()}`
  });
  await e2eSeed.focus.task({
    label: `E2E task ctx second ${Date.now()}`
  });
  await openTaskLibrary(page);
  const thumbnails = await getTaskLibraryThumbnails(page);
  const firstTask = thumbnails.nth(0);
  const secondTask = thumbnails.nth(1);

  await openThumbnailContextMenu(page, firstTask);
  await expect(
    page.locator(".popover").getByRole("button", { name: /^Select$/i })
  ).toBeVisible({ timeout: 8_000 });

  await secondTask.scrollIntoViewIfNeeded();
  await secondTask.hover();
  await expect(page.locator(".popover")).toHaveCount(0, { timeout: 8_000 });

  await openThumbnailContextMenu(page, secondTask);
  const secondSelectAction = page
    .locator(".popover")
    .getByRole("button", { name: /^Select$/i });
  await expect(secondSelectAction).toBeVisible({ timeout: 8_000 });
  await secondSelectAction.click({ timeout: 5_000 });
  await expect(page.getByText(/Selected: 1 task/i)).toBeVisible({
    timeout: 10_000
  });
});

test("from library - context menu appears with expected actions on hover (Library → Tasks) @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const taskName = `E2E task ctx ${Date.now()}`;
  const task = await e2eSeed.focus.task({ label: taskName });
  await openTaskContextMenuFromLibrary(page, task.id);

  await expectContextMenuItems(
    page,
    requireResourceBrowseContract(test.info().project.name, "task")
      .libraryActionIds
  );

  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press("Escape");
  }
});

test("from record page - direct task controls replace the thumbnail context menu @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const taskName = `E2E task rec ctx ${Date.now()}`;
  const task = await e2eSeed.focus.task({ label: taskName });

  await openTaskRecord(page, test.info().project.name, task.id);

  const contract = requireResourceBrowseContract(
    test.info().project.name,
    "task"
  );
  for (const controlName of contract.recordControlNames) {
    await expect(
      page.getByRole("button", { name: controlName }).filter({ visible: true })
    ).toBeVisible({ timeout: 8_000 });
  }
  await expect(
    getResourceRecordSurface(page).getByTestId(`task-checkbox:${task.id}`)
  ).toBeVisible();
  await expect(getResourceRecordContextMenuTrigger(page)).toHaveCount(0);
});
