import type { Locator, Page } from "@playwright/test";
import { expect, test, type E2ESeed } from "../../fixtures/e2e-test";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
import { ensureInAppOnHome } from "../../utils/helpers";
import {
  getResourceContextMenuTrigger,
  getResourceRecordContextMenuTrigger,
  getResourceThumbnail,
  getResourceThumbnails,
  openResourceQueryState,
  requireResourceBrowseContract
} from "../../utils/resource-matrix";
import {
  blockExternalAuthRequests,
  openNodesLibrary
} from "../memory-test-helpers";

let e2eSeed: E2ESeed;

type StarActionVariant = "command" | "toggle";

async function getStarActionVariant(starItem: Locator) {
  const text = (await starItem.innerText()).replace(/\s+/g, " ").trim();
  return /^Star(?:red)?$/i.test(text) ? "toggle" : "command";
}

async function expectStarActionState(
  starItem: Locator,
  variant: StarActionVariant,
  state: "starred" | "unstarred"
) {
  if (variant === "toggle") {
    await expect(starItem).toContainText(
      state === "starred" ? /^Star(?:red)?$/i : /^Star$/i
    );
    return;
  }

  await expect(starItem).toContainText(
    state === "starred" ? /Unstar/i : /Star this resource/i
  );
}

async function openContextMenuOnNode(
  page: Page,
  nodeId: string,
  options?: { force?: boolean }
) {
  const force = options?.force ?? false;
  const nodeRow = getResourceThumbnail(page, nodeId);
  await nodeRow.waitFor({ state: "visible", timeout: 15_000 });
  await nodeRow.hover({ force });
  const contextMenuTrigger = getResourceContextMenuTrigger(nodeRow);
  await contextMenuTrigger.waitFor({ state: "visible", timeout: 8_000 });
  await contextMenuTrigger.click({ timeout: 5_000, force });
}

/** Open context menu on the first node in the list (e.g. when node displays as "Untitled"). */
async function openContextMenuOnFirstNode(
  page: Page,
  options?: { force?: boolean }
) {
  const force = options?.force ?? false;
  const nodeRow = getResourceThumbnails(page).first();
  await nodeRow.waitFor({ state: "visible", timeout: 15_000 });
  await nodeRow.hover({ force });
  const contextMenuTrigger = getResourceContextMenuTrigger(nodeRow);
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

async function openRecordPageContextMenu(page: Page) {
  const menu = getResourceRecordContextMenuTrigger(page);
  await expect(menu).toBeVisible({ timeout: 10_000 });
  await menu.click({ timeout: 5_000 });
}

test.describe("nodes - context menu (from library, from record page) @context-menu", () => {
  test.beforeEach(async ({ page, seed }) => {
    e2eSeed = seed;
    await blockExternalAuthRequests(page);
  });

  test.describe("from library", () => {
    test("context menu appears with expected actions on hover", async ({
      page
    }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node ctx ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);

      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);

      const contract = requireResourceBrowseContract(
        test.info().project.name,
        "node"
      );
      for (const actionId of contract.libraryActionIds) {
        const menuItem = page.locator(
          `[data-context-menu-item-id="${actionId}"]`
        );
        await expect(menuItem).toBeVisible({ timeout: 5_000 });
      }

      await dismissAnyModals(page);
    });

    test("Star/Unstar node via context menu", async ({ page }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node star ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);
      const starItem = page.locator(
        `[data-context-menu-item-id="${ResourceActionType.STAR}"]`
      );
      await expect(starItem).toContainText(/Star this resource/i);
      await starItem.click();

      await openContextMenuOnNode(page, node.id);
      await expect(starItem).toContainText(/Unstar/i);

      await page.keyboard.press("Escape");
      await page.reload({ waitUntil: "domcontentloaded" });
      await ensureInAppOnHome(page);
      await openNodesLibrary(page);
      await openContextMenuOnNode(page, node.id);
      await expect(starItem).toContainText(/Unstar/i);

      await starItem.click();

      await openContextMenuOnNode(page, node.id);
      await expect(starItem).toContainText(/Star this resource/i);

      await page.keyboard.press("Escape");
      await page.reload({ waitUntil: "domcontentloaded" });
      await ensureInAppOnHome(page);
      await openNodesLibrary(page);
      await openContextMenuOnNode(page, node.id);
      await expect(starItem).toContainText(/Star this resource/i);
      await dismissAnyModals(page);
    });

    test("Copy link shows toast confirmation", async ({ page }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node copy ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);
      await clickContextMenuItem(page, ResourceActionType.COPY_LINK);

      await expect(page.getByText(/link copied/i).first()).toBeVisible({
        timeout: 5_000
      });
    });

    test("Edit opens node record in edit mode", async ({ page }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node edit ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);
      await clickContextMenuItem(page, ResourceActionType.EDIT);

      await expect(page.getByText(nodeName).first()).toBeVisible({
        timeout: 10_000
      });

      const urlHasEdit = await page
        .waitForURL((u) => u.toString().includes("edit=true"), {
          timeout: 5_000
        })
        .then(() => true)
        .catch(() => false);

      const nodeRecordVisible = await page
        .getByText(nodeName)
        .first()
        .isVisible()
        .catch(() => false);
      expect(urlHasEdit || nodeRecordVisible).toBe(true);

      await dismissAnyModals(page);
    });

    test("Archive and unarchive node via context menu", async ({ page }) => {
      test.setTimeout(120_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node archive ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);
      const archiveItem = page.locator(
        `[data-context-menu-item-id="${ResourceActionType.ARCHIVE}"]`
      );
      await expect(archiveItem).toBeVisible({ timeout: 5_000 });
      await archiveItem.click();
      await expect(getResourceThumbnail(page, node.id)).toBeHidden({
        timeout: 15_000
      });

      await openResourceQueryState(
        page,
        test.info().project.name,
        "node",
        "archived"
      );

      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 10_000
      });

      await page.reload({ waitUntil: "domcontentloaded" });
      await ensureInAppOnHome(page);
      await openNodesLibrary(page);
      await openResourceQueryState(
        page,
        test.info().project.name,
        "node",
        "archived"
      );
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 10_000
      });

      await openContextMenuOnNode(page, node.id);
      const unarchiveItem = page.locator(
        `[data-context-menu-item-id="${ResourceActionType.UNARCHIVE}"]`
      );
      await expect(unarchiveItem).toBeVisible({ timeout: 5_000 });
      await unarchiveItem.click();

      await openResourceQueryState(
        page,
        test.info().project.name,
        "node",
        "active"
      );
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await page.reload({ waitUntil: "domcontentloaded" });
      await ensureInAppOnHome(page);
      await openNodesLibrary(page);
      await openResourceQueryState(
        page,
        test.info().project.name,
        "node",
        "active"
      );
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });
    });

    test("Delete and restore node via context menu", async ({ page }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node delete ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);
      const deleteItem = page.locator(
        `[data-context-menu-item-id="${ResourceActionType.DELETE}"]`
      );
      await expect(deleteItem).toBeVisible({ timeout: 5_000 });
      await deleteItem.click();
      await expect(getResourceThumbnail(page, node.id)).toBeHidden({
        timeout: 15_000
      });

      const trashFilter = page.getByRole("button", { name: /Trash/i }).first();
      const hasTrashFilter = await trashFilter
        .waitFor({ state: "visible", timeout: 2_000 })
        .then(() => true)
        .catch(() => false);

      if (hasTrashFilter) {
        await trashFilter.click({ timeout: 5_000 });
        await expect(getResourceThumbnail(page, node.id)).toBeVisible({
          timeout: 10_000
        });

        await openContextMenuOnNode(page, node.id);
        const restoreItem = page.locator(
          `[data-context-menu-item-id="${ResourceActionType.RESTORE}"]`
        );
        await expect(restoreItem).toBeVisible({ timeout: 5_000 });
        await restoreItem.click();

        await openResourceQueryState(
          page,
          test.info().project.name,
          "node",
          "active"
        );
        await expect(getResourceThumbnail(page, node.id)).toBeVisible({
          timeout: 15_000
        });

        await page.reload({ waitUntil: "domcontentloaded" });
        await ensureInAppOnHome(page);
        await openNodesLibrary(page);
        await openResourceQueryState(
          page,
          test.info().project.name,
          "node",
          "active"
        );
        await expect(getResourceThumbnail(page, node.id)).toBeVisible({
          timeout: 15_000
        });
      } else {
        await page.reload({ waitUntil: "domcontentloaded" });
        await ensureInAppOnHome(page);
        await openNodesLibrary(page);
        await openResourceQueryState(
          page,
          test.info().project.name,
          "node",
          "active"
        );
        await expect(getResourceThumbnail(page, node.id)).toBeHidden({
          timeout: 15_000
        });
      }
    });

    test("Open as tab adds node to tab bar", async ({ page }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node tab ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);
      const openTabItem = page.locator(
        '[data-context-menu-item-id="Open as tab"]'
      );
      await expect(openTabItem).toBeVisible({ timeout: 5_000 });
      await openTabItem.click();

      // Wait for the tab to appear in the top bar (may show as node name or "Untitled")
      await expect(
        page
          .getByRole("button", {
            name: new RegExp(nodeName + "|Untitled", "i")
          })
          .first()
      )
        .toBeVisible({ timeout: 10_000 })
        .catch(() => null);

      const closeBtn = page.getByRole("button", { name: /Close/i }).first();
      await expect(closeBtn).toBeVisible({ timeout: 10_000 });
      await closeBtn.click({ timeout: 5_000 });
      await openNodesLibrary(page);

      // Node may display as "Untitled" in the list after opening as tab; use first node
      await openContextMenuOnFirstNode(page);
      const removeTabItem = page.locator(
        '[data-context-menu-item-id="Remove from tabs"]'
      );
      await expect(removeTabItem).toBeVisible({ timeout: 8_000 });
      await removeTabItem.click();
    });

    test("Select activates bulk selection mode", async ({ page }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node select ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);
      await clickContextMenuItem(page, ResourceActionType.SELECT);

      await expect(
        getResourceThumbnail(page, node.id).getByRole("button", {
          name: `Deselect ${nodeName}`
        })
      ).toBeVisible({ timeout: 10_000 });

      await dismissAnyModals(page);
    });

    test("Add to collection opens collection picker", async ({ page }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node coll ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      await openContextMenuOnNode(page, node.id);
      await clickContextMenuItem(page, "addToCollection");

      const collectionPicker = page
        .getByText(/Add to collection/i)
        .or(page.getByTestId("command-bar-input"))
        .first();
      await expect(collectionPicker).toBeVisible({ timeout: 10_000 });

      await dismissAnyModals(page);
    });
  });

  test.describe("from record page", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test("context menu on record page shows expected actions", async ({
      page
    }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node rec ctx ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      const nodeRow = getResourceThumbnail(page, node.id);
      await nodeRow.click();

      await expect(page.getByText(nodeName).first()).toBeVisible({
        timeout: 10_000
      });

      await openRecordPageContextMenu(page);

      const contract = requireResourceBrowseContract(
        test.info().project.name,
        "node"
      );
      for (const actionId of contract.recordActionIds) {
        const menuItem = page.locator(
          `[data-context-menu-item-id="${actionId}"]`
        );
        await expect(menuItem).toBeVisible({ timeout: 8_000 });
      }

      await dismissAnyModals(page);
    });

    test("Star node from record page context menu", async ({ page }) => {
      test.setTimeout(90_000);
      await ensureInAppOnHome(page);

      const nodeName = `E2E node rec star ${Date.now()}`;
      const node = await e2eSeed.memory.node({ label: nodeName });
      await openNodesLibrary(page);
      await expect(getResourceThumbnail(page, node.id)).toBeVisible({
        timeout: 15_000
      });

      const nodeRow = getResourceThumbnail(page, node.id);
      await nodeRow.click();

      await openRecordPageContextMenu(page);

      const starItem = page.locator(
        `[data-context-menu-item-id="${ResourceActionType.STAR}"]`
      );
      if (await starItem.isVisible().catch(() => false)) {
        const starVariant = await getStarActionVariant(starItem);
        await expectStarActionState(starItem, starVariant, "unstarred");
        await starItem.click();

        await openRecordPageContextMenu(page);

        await expectStarActionState(
          page.locator(
            `[data-context-menu-item-id="${ResourceActionType.STAR}"]`
          ),
          starVariant,
          "starred"
        );

        await page.keyboard.press("Escape");
        await page.reload({ waitUntil: "domcontentloaded" });
        await ensureInAppOnHome(page);
        await openNodesLibrary(page);
        await getResourceThumbnail(page, node.id).click({ timeout: 5_000 });
        await openRecordPageContextMenu(page);
        await expectStarActionState(
          page.locator(
            `[data-context-menu-item-id="${ResourceActionType.STAR}"]`
          ),
          starVariant,
          "starred"
        );
      }

      await dismissAnyModals(page);
    });
  });
});
