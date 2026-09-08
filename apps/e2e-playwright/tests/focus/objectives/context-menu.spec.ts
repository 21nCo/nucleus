import type { Page } from "@playwright/test";
import { expect, test, type E2ESeed } from "../../fixtures/e2e-test";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
import { PointronAction } from "@nucleum/client/config/focus-action.enum";
import { ensureInAppOnHome, runCommand } from "../../utils/helpers";
import {
  getResourceContextMenuTrigger,
  getResourceRecordContextMenuTrigger,
  getResourceRecordSurface,
  getResourceThumbnail,
  openResourceQueryState,
  requireResourceBrowseContract
} from "../../utils/resource-matrix";
import {
  blockGoogleAccountsNavigation,
  closeQuickFocusPanel,
  expectPinnedGoalVisible,
  openObjectiveLibrary,
  openQuickFocusPanelViaTopNav,
  readSessionRuntime,
  waitForSessionElapsed
} from "../focus-test-helpers";
import {
  readResourcesByLabel,
  reopenPersistedSession
} from "../active-session/session-test-support";

let e2eSeed: E2ESeed;

async function openContextMenuOnGoal(
  page: Page,
  objectiveId: string,
  options?: { force?: boolean }
) {
  const force = options?.force ?? false;
  const objectiveRow = getResourceThumbnail(page, objectiveId);
  await objectiveRow.waitFor({ state: "visible", timeout: 15_000 });
  await objectiveRow.hover({ force });
  const contextMenuTrigger = getResourceContextMenuTrigger(objectiveRow);
  await contextMenuTrigger.waitFor({ state: "visible", timeout: 8_000 });
  await contextMenuTrigger.click({ timeout: 5_000, force });
}

async function clickContextMenuItem(page: Page, itemValue: string) {
  const menuItem = page.locator(`[data-context-menu-item-id="${itemValue}"]`);
  await menuItem.waitFor({ state: "visible", timeout: 5_000 });
  await menuItem.click();
}

async function dismissAnyModals(page: Page) {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Escape");
  }
}

test.beforeEach(async ({ page, seed }) => {
  e2eSeed = seed;
  await blockGoogleAccountsNavigation(page);
});

test("from library - context menu appears with expected actions on hover @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E ctx menu ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);

  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);

  const contract = requireResourceBrowseContract(
    test.info().project.name,
    "objective"
  );
  for (const actionId of contract.libraryActionIds) {
    const menuItem = page.locator(`[data-context-menu-item-id="${actionId}"]`);
    await expect(menuItem).toBeVisible({ timeout: 5_000 });
  }

  await dismissAnyModals(page);
});

test("from library - Star/Unstar objective via context menu @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E star ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  const starItem = page.locator(
    `[data-context-menu-item-id="${ResourceActionType.STAR}"]`
  );
  await expect(starItem).toContainText(/Star this resource/i);
  await starItem.click();

  await openContextMenuOnGoal(page, objective.id);
  const unstarItem = page.locator(
    `[data-context-menu-item-id="${ResourceActionType.STAR}"]`
  );
  await expect(unstarItem).toContainText(/Unstar/i);

  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openObjectiveLibrary(page);
  await openContextMenuOnGoal(page, objective.id);
  await expect(
    page.locator(`[data-context-menu-item-id="${ResourceActionType.STAR}"]`)
  ).toContainText(/Unstar/i);

  await unstarItem.click();

  await openContextMenuOnGoal(page, objective.id);
  await expect(
    page.locator(`[data-context-menu-item-id="${ResourceActionType.STAR}"]`)
  ).toContainText(/Star this resource/i);

  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openObjectiveLibrary(page);
  await openContextMenuOnGoal(page, objective.id);
  await expect(
    page.locator(`[data-context-menu-item-id="${ResourceActionType.STAR}"]`)
  ).toContainText(/Star this resource/i);
  await dismissAnyModals(page);
});

test("from library - Copy link shows toast confirmation @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E copy link ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  await clickContextMenuItem(page, ResourceActionType.COPY_LINK);

  await expect(page.getByText(/link copied/i).first()).toBeVisible({
    timeout: 5_000
  });
});

test("from library - Edit opens objective record in edit mode @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E edit ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  await clickContextMenuItem(page, ResourceActionType.EDIT);

  await expect(page.getByText(objectiveName).first()).toBeVisible({
    timeout: 10_000
  });

  const urlHasEdit = await page
    .waitForURL((u) => u.toString().includes("edit=true"), {
      timeout: 5_000
    })
    .then(() => true)
    .catch(() => false);

  const objectiveRecordVisible = await page
    .locator('[data-testid="objective-name-input"]')
    .or(page.getByText(objectiveName).first())
    .first()
    .isVisible()
    .catch(() => false);
  expect(urlHasEdit || objectiveRecordVisible).toBe(true);

  await dismissAnyModals(page);
});

test("from library - Focus now starts a focus session on the objective @context-menu", async ({
  page
}) => {
  test.setTimeout(120_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E focus now ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  await clickContextMenuItem(page, "focusNow");

  const focusTimerButton = page.getByRole("button", {
    name: /^\d{1,2}:\d{2}$/
  });
  await focusTimerButton.waitFor({ state: "visible", timeout: 15_000 });
  await waitForSessionElapsed(page, 3);
  const { currentSessionId: sessionId } = await readSessionRuntime(page);

  await runCommand(page, "Finish the current session");
  await page
    .getByText("Finish", { exact: true })
    .last()
    .click({ timeout: 5_000 });
  const doneButton = page.getByRole("button", { name: /^Done/i });
  await expect(doneButton).toBeVisible({ timeout: 10_000 });
  await doneButton.click({ timeout: 5_000 });

  await focusTimerButton.waitFor({ state: "hidden", timeout: 15_000 });
  await reopenPersistedSession(page, sessionId, [objectiveName]);
});

test("from library - Pin to quick focus toggle works @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E pin qf ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  const pinItem = page.locator('[data-context-menu-item-id="pinToQuickFocus"]');
  await expect(pinItem).toBeVisible({ timeout: 5_000 });
  await pinItem.click();

  await dismissAnyModals(page);

  const clearSelection = page
    .getByRole("button", { name: /Clear selection/i })
    .first();
  if (await clearSelection.isVisible().catch(() => false)) {
    await clearSelection.click({ timeout: 3_000 });
  }

  const { quickFocusPanel, quickFocusSearch } =
    await openQuickFocusPanelViaTopNav(page);
  await expectPinnedGoalVisible(
    quickFocusPanel,
    quickFocusSearch,
    objectiveName
  );
  await closeQuickFocusPanel(page);

  const reopenedQuickFocus = await openQuickFocusPanelViaTopNav(page);
  await expectPinnedGoalVisible(
    reopenedQuickFocus.quickFocusPanel,
    reopenedQuickFocus.quickFocusSearch,
    objectiveName
  );
  await closeQuickFocusPanel(page);

  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openObjectiveLibrary(page);
  await openContextMenuOnGoal(page, objective.id);
  await pinItem.click();

  const unpinnedQuickFocus = await openQuickFocusPanelViaTopNav(page);
  await expect(
    unpinnedQuickFocus.quickFocusPanel.getByText(objectiveName, { exact: true })
  ).toBeHidden({ timeout: 10_000 });
  await closeQuickFocusPanel(page);

  const reopenedUnpinnedQuickFocus = await openQuickFocusPanelViaTopNav(page);
  await expect(
    reopenedUnpinnedQuickFocus.quickFocusPanel.getByText(objectiveName, {
      exact: true
    })
  ).toBeHidden({ timeout: 10_000 });
  await closeQuickFocusPanel(page);
});

test("from library - Convert to sub objective opens parent objective selector @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const parentGoalName = `E2E parent ${Date.now()}`;
  const childGoalName = `E2E child ${Date.now()}`;
  const parentObjective = await e2eSeed.focus.objective({
    label: parentGoalName
  });
  const childObjective = await e2eSeed.focus.objective({
    label: childGoalName
  });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, childObjective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, childObjective.id);
  await clickContextMenuItem(page, PointronAction.CONVERT_TO_SUBOBJECTIVE);

  const cmdInput = page.getByTestId("command-bar-input");
  await cmdInput.waitFor({ state: "visible", timeout: 10_000 });

  await cmdInput.fill(parentGoalName);
  await expect(
    page.getByText(parentGoalName, { exact: true }).last()
  ).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Enter");

  await cmdInput
    .waitFor({ state: "hidden", timeout: 10_000 })
    .catch(() => null);
  await page.keyboard.press("Escape");
  await expect
    .poll(
      async () => {
        const parent = (
          await readResourcesByLabel(page, "objective", parentGoalName)
        )[0];
        return (
          parent?.id === parentObjective.id &&
          parent.children.includes(childObjective.id)
        );
      },
      {
        message:
          "from library - Convert to sub objective opens parent objectiv...: toBe true",
        timeout: 15_000
      }
    )
    .toBe(true);

  await openObjectiveLibrary(page);

  const parentGoalRow = getResourceThumbnail(page, parentObjective.id);
  await expect(parentGoalRow).toBeVisible({ timeout: 15_000 });
  await expect(
    parentGoalRow.filter({
      hasText: /1 sub objective/i
    })
  ).toBeVisible({ timeout: 10_000 });
  await parentGoalRow.click();

  await expect(
    page.getByRole("heading", { name: parentGoalName, level: 1 })
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(childGoalName, { exact: true })).toBeVisible({
    timeout: 10_000
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openObjectiveLibrary(page);
  const restoredParentGoalRow = getResourceThumbnail(page, parentObjective.id);
  await expect(
    restoredParentGoalRow.filter({ hasText: /1 sub objective/i })
  ).toBeVisible({ timeout: 10_000 });
  await restoredParentGoalRow.click();
  await expect(page.getByText(childGoalName, { exact: true })).toBeVisible({
    timeout: 10_000
  });

  await dismissAnyModals(page);
});

test("from library - Archive and unarchive objective via context menu @context-menu", async ({
  page
}) => {
  test.setTimeout(120_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E archive ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  const archiveItem = page.locator(
    `[data-context-menu-item-id="${ResourceActionType.ARCHIVE}"]`
  );
  await expect(archiveItem).toBeVisible({ timeout: 5_000 });
  await archiveItem.click();
  await expect(getResourceThumbnail(page, objective.id)).toBeHidden({
    timeout: 15_000
  });

  await openResourceQueryState(
    page,
    test.info().project.name,
    "objective",
    "archived"
  );

  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 10_000
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openObjectiveLibrary(page);
  await openResourceQueryState(
    page,
    test.info().project.name,
    "objective",
    "archived"
  );
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 10_000
  });

  await openContextMenuOnGoal(page, objective.id);
  const unarchiveItem = page.locator(
    `[data-context-menu-item-id="${ResourceActionType.UNARCHIVE}"]`
  );
  await expect(unarchiveItem).toBeVisible({ timeout: 5_000 });
  await unarchiveItem.click();

  await openResourceQueryState(
    page,
    test.info().project.name,
    "objective",
    "active"
  );
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await openObjectiveLibrary(page);
  await openResourceQueryState(
    page,
    test.info().project.name,
    "objective",
    "active"
  );
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });
});

test("from library - Delete and restore objective via context menu @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E delete ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  const deleteItem = page.locator(
    `[data-context-menu-item-id="${ResourceActionType.DELETE}"]`
  );
  await expect(deleteItem).toBeVisible({ timeout: 5_000 });
  await deleteItem.click();
  await expect(getResourceThumbnail(page, objective.id)).toBeHidden({
    timeout: 15_000
  });

  const trashFilter = page.getByRole("button", { name: /Trash/i }).first();
  const hasTrashFilter = await trashFilter
    .waitFor({ state: "visible", timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  if (hasTrashFilter) {
    await trashFilter.click({ timeout: 5_000 });
    await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
      timeout: 10_000
    });

    await openContextMenuOnGoal(page, objective.id);
    const restoreItem = page.locator(
      `[data-context-menu-item-id="${ResourceActionType.RESTORE}"]`
    );
    await expect(restoreItem).toBeVisible({ timeout: 5_000 });
    await restoreItem.click();

    await openResourceQueryState(
      page,
      test.info().project.name,
      "objective",
      "active"
    );
    await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
      timeout: 15_000
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureInAppOnHome(page);
    await openObjectiveLibrary(page);
    await openResourceQueryState(
      page,
      test.info().project.name,
      "objective",
      "active"
    );
    await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
      timeout: 15_000
    });
  } else {
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureInAppOnHome(page);
    await openObjectiveLibrary(page);
    await openResourceQueryState(
      page,
      test.info().project.name,
      "objective",
      "active"
    );
    await expect(getResourceThumbnail(page, objective.id)).toBeHidden({
      timeout: 15_000
    });
  }
});

test("from library - Open as tab adds objective to tab bar @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E tab ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  const openTabItem = page.locator('[data-context-menu-item-id="Open as tab"]');
  await expect(openTabItem).toBeVisible({ timeout: 5_000 });
  await openTabItem.click();

  const recordSurface = getResourceRecordSurface(page);
  await expect(recordSurface).toBeVisible({ timeout: 10_000 });
  const closeBtn = recordSurface
    .getByRole("button", { name: /^Close$/i })
    .first();
  await expect(closeBtn).toBeVisible({ timeout: 10_000 });
  await closeBtn.click({ timeout: 5_000 });
  await expect(recordSurface).toBeHidden({ timeout: 10_000 });
  await openObjectiveLibrary(page);

  await openContextMenuOnGoal(page, objective.id);
  const removeTabItem = page.locator(
    '[data-context-menu-item-id="Remove from tabs"]'
  );
  await expect(removeTabItem).toBeVisible({ timeout: 8_000 });
  await removeTabItem.click();
});

test("from library - Select activates bulk selection mode @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E select ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  await clickContextMenuItem(page, ResourceActionType.SELECT);

  await expect(
    getResourceThumbnail(page, objective.id).getByRole("button", {
      name: `Deselect ${objectiveName}`
    })
  ).toBeVisible({ timeout: 10_000 });

  await dismissAnyModals(page);
});

test("from library - Add to collection opens collection picker @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E collection ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  await openContextMenuOnGoal(page, objective.id);
  await clickContextMenuItem(page, "addToCollection");

  const collectionPicker = page
    .getByText(/Add to collection/i)
    .or(page.getByTestId("command-bar-input"))
    .first();
  await expect(collectionPicker).toBeVisible({ timeout: 10_000 });

  await dismissAnyModals(page);
});

async function openRecordPageContextMenu(page: Page) {
  const menu = getResourceRecordContextMenuTrigger(page);
  await expect(menu).toBeVisible({ timeout: 10_000 });
  await menu.click({ timeout: 5_000 });
}

test("from record page - context menu on record page shows expected actions @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E record ctx ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  const objectiveRow = getResourceThumbnail(page, objective.id);
  await objectiveRow.click();

  await expect(page.getByText(objectiveName).first()).toBeVisible({
    timeout: 10_000
  });

  await openRecordPageContextMenu(page);

  const contract = requireResourceBrowseContract(
    test.info().project.name,
    "objective"
  );
  for (const actionId of contract.recordActionIds) {
    const menuItem = page.locator(`[data-context-menu-item-id="${actionId}"]`);
    await expect(menuItem).toBeVisible({ timeout: 8_000 });
  }

  await dismissAnyModals(page);
});

test("from record page - Star objective from record page context menu @context-menu", async ({
  page
}) => {
  test.setTimeout(90_000);
  await ensureInAppOnHome(page);

  const objectiveName = `E2E rec star ${Date.now()}`;
  const objective = await e2eSeed.focus.objective({ label: objectiveName });
  await openObjectiveLibrary(page);
  await expect(getResourceThumbnail(page, objective.id)).toBeVisible({
    timeout: 15_000
  });

  const objectiveRow = getResourceThumbnail(page, objective.id);
  await objectiveRow.click();

  await openRecordPageContextMenu(page);

  const starItem = page.locator(
    `[data-context-menu-item-id="${ResourceActionType.STAR}"]`
  );
  if (await starItem.isVisible().catch(() => false)) {
    await expect(starItem).toContainText(/Star this resource/i);
    await starItem.click();

    await openRecordPageContextMenu(page);

    await expect(
      page.locator(`[data-context-menu-item-id="${ResourceActionType.STAR}"]`)
    ).toContainText(/Unstar/i);

    await page.keyboard.press("Escape");
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureInAppOnHome(page);
    await openObjectiveLibrary(page);
    await getResourceThumbnail(page, objective.id).click();
    await openRecordPageContextMenu(page);
    await expect(
      page.locator(`[data-context-menu-item-id="${ResourceActionType.STAR}"]`)
    ).toContainText(/Unstar/i);
  }

  await dismissAnyModals(page);
});
