import { expect, test, type E2ESeed } from "../../fixtures/e2e-test";
import path from "node:path";
import { ensureInAppOnHome, runCommand } from "../../utils/helpers";
import { expectAnyLocatorVisible } from "../../utils/locator-assertions";
import { resolveRepoFsImportPath } from "../../utils/repo-fs";
import { openDeclaredNodeContentPanel } from "../../utils/settings-contracts";
import {
  addCollectionThroughCollectionsLane,
  expectCollectionRecordOpenedFromLane,
  expectCollectionTagAbsent,
  expectCollectionTagVisible,
  openCollectionFromCollectionsLane,
  removeCollectionThroughCollectionsLane
} from "../../utils/collections-lane";
import {
  blockExternalAuthRequests,
  getLinkSearchResult,
  getLinkedNodeItem,
  openNodeRecordFromLibrary
} from "../memory-test-helpers";

let e2eSeed: E2ESeed;

const datafnStorePath = resolveRepoFsImportPath(
  "client/datafn/datafn.store.ts"
);

async function readPersistedNodeNotes(
  page: import("@playwright/test").Page,
  nodeId: string
) {
  return page.evaluate(
    async ({ modulePath, nodeId }) => {
      const { datafn } = await import(modulePath);
      const result = await datafn.node.query({
        filters: { id: nodeId },
        limit: 1,
        metadata: {
          includeArchived: true,
          includeTrashed: true
        }
      });
      return result.data?.[0]?.notes ?? "";
    },
    { modulePath: datafnStorePath, nodeId }
  );
}

const pdfFixturePath = path.resolve(
  __dirname,
  "..",
  "..",
  "fixtures",
  "files",
  "Lorem_ipsum.pdf"
);

test.describe("nodes - record page (opening, visibility, tab switching) @record-page", () => {
  test.beforeEach(async ({ page, seed }) => {
    e2eSeed = seed;
    await blockExternalAuthRequests(page);
  });

  async function openNodeContentPanel(page: import("@playwright/test").Page) {
    await openDeclaredNodeContentPanel(page, test.info().project.name);
    const viewer = page.locator("#viewerContainer");
    const visible = await viewer
      .waitFor({ state: "visible", timeout: 60_000 })
      .then(() => true)
      .catch(() => false);
    if (!visible) {
      throw new Error(
        "E2E_SURFACE_001: PDF viewer did not appear after explicit content-panel navigation"
      );
    }
  }

  async function openNodePanel(
    page: import("@playwright/test").Page,
    name: RegExp
  ) {
    const tab = page
      .getByRole("tab", { name })
      .filter({ visible: true })
      .first();
    const button = page
      .getByRole("button", { name })
      .filter({ visible: true })
      .first();
    await expectAnyLocatorVisible([tab, button], {
      message: `node panel ${name} exposes a visible navigation control`,
      timeout: 15_000
    });
    await ((await tab.isVisible().catch(() => false)) ? tab : button).click({
      timeout: 5_000
    });
  }

  test("open node record and assert panels/content visible", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const nodeName = `E2E node record ${Date.now()}`;
    await e2eSeed.memory.node({ label: nodeName });
    await openNodeRecordFromLibrary(page, nodeName);

    await expect(page.getByText(nodeName).first()).toBeVisible({
      timeout: 20_000
    });
    await expect(
      page.getByRole("button", { name: /Close/i }).first()
    ).toBeVisible({
      timeout: 10_000
    });
  });

  test("tab switching and visibility on node record page", async ({ page }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const nodeName = `E2E node tabs ${Date.now()}`;
    await e2eSeed.memory.node({ label: nodeName });
    await openNodeRecordFromLibrary(page, nodeName);

    const tabList = page.getByRole("tablist").first();
    await expect(tabList).toBeVisible({ timeout: 10_000 });

    const tabs = tabList.getByRole("tab");
    await expect(tabs.first()).toBeVisible({ timeout: 10_000 });

    const tabCount = await tabs.count();
    const clickIndexes = Array.from(
      { length: Math.min(tabCount, 3) },
      (_, i) => i
    );
    for (const idx of clickIndexes) {
      const tab = tabs.nth(idx);
      await tab.click({ timeout: 5_000 });
      await expect(tab).toHaveAttribute("aria-selected", "true", {
        timeout: 5_000
      });
    }
  });

  test("open PDF node and confirm viewer only after explicit content-panel navigation", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    await runCommand(page, "Capture");
    await page
      .locator('button[data-value="UPLOAD"]')
      .first()
      .click({ timeout: 8_000 });
    await page
      .locator('input[type="file"][accept*=".pdf"]')
      .first()
      .setInputFiles(pdfFixturePath);

    await openNodeContentPanel(page);
    await expect(page.locator("#viewerContainer")).toBeVisible({
      timeout: 5_000
    });
  });

  test("add collection from node record page collections lane with reopen persistence", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const token = String(Date.now()).slice(-6);
    const nodeName = `NodeCL-${token}`;
    const collectionName = `NCol-${token}`;

    await e2eSeed.memory.node({ label: nodeName });
    await openNodeRecordFromLibrary(page, nodeName);

    await addCollectionThroughCollectionsLane(page, collectionName);
    await expectCollectionTagVisible(page, collectionName);

    await openNodeRecordFromLibrary(page, nodeName);
    await expectCollectionTagVisible(page, collectionName);
  });

  test("open linked collection from node record page collections lane", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const token = String(Date.now()).slice(-6);
    const nodeName = `NodeCLNav-${token}`;
    const collectionName = `NColNav-${token}`;

    await e2eSeed.collections.collection({
      label: collectionName,
      resource: "node"
    });
    await e2eSeed.memory.node({ label: nodeName });
    await openNodeRecordFromLibrary(page, nodeName);

    await addCollectionThroughCollectionsLane(page, collectionName);
    await expectCollectionTagVisible(page, collectionName);
    await openCollectionFromCollectionsLane(page, collectionName);
    await expectCollectionRecordOpenedFromLane(page, collectionName);
  });

  test("remove collection from node record page collections lane on current page", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const token = String(Date.now()).slice(-6);
    const nodeName = `NodeCLRm-${token}`;
    const collectionName = `NColRm-${token}`;

    await e2eSeed.memory.node({ label: nodeName });
    await openNodeRecordFromLibrary(page, nodeName);

    await addCollectionThroughCollectionsLane(page, collectionName);
    await expectCollectionTagVisible(page, collectionName);
    await removeCollectionThroughCollectionsLane(
      page,
      collectionName,
      "context-menu"
    );
    await expectCollectionTagAbsent(page, collectionName);

    await openNodeRecordFromLibrary(page, nodeName);
    await expectCollectionTagAbsent(page, collectionName);
  });

  test("link node from node record page links panel and verify reopen persistence", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const token = String(Date.now()).slice(-6);
    const sourceNodeName = `NodeLinkSrc-${token}`;
    const targetNodeName = `NodeLinkTgt-${token}`;

    await e2eSeed.memory.node({ label: targetNodeName });
    await e2eSeed.memory.node({ label: sourceNodeName });
    await openNodeRecordFromLibrary(page, sourceNodeName);

    await openNodePanel(page, /^Links$/i);

    const searchInput = page
      .getByRole("complementary")
      .getByPlaceholder(/Start searching to add a direct link/i)
      .first();
    await searchInput.waitFor({ state: "visible", timeout: 15_000 });
    await searchInput.fill(targetNodeName);

    const resultItem = getLinkSearchResult(page, targetNodeName);
    await resultItem.waitFor({ state: "visible", timeout: 15_000 });
    await resultItem.click({ timeout: 5_000 });

    const linkedItem = getLinkedNodeItem(page, targetNodeName);
    await expect(linkedItem).toBeVisible({ timeout: 10_000 });

    await openNodeRecordFromLibrary(page, sourceNodeName);
    await openNodePanel(page, /^Links$/i);
    await expect(getLinkedNodeItem(page, targetNodeName)).toBeVisible({
      timeout: 10_000
    });
  });

  test("link node from node record page links panel with keyboard selection and verify reopen persistence", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const token = String(Date.now()).slice(-6);
    const sourceNodeName = `NodeLinkKeySrc-${token}`;
    const targetNodeName = `NodeLinkKeyTgt-${token}`;

    await e2eSeed.memory.node({ label: targetNodeName });
    await e2eSeed.memory.node({ label: sourceNodeName });
    await openNodeRecordFromLibrary(page, sourceNodeName);

    await openNodePanel(page, /^Links$/i);

    const searchInput = page
      .getByRole("complementary")
      .getByPlaceholder(/Start searching to add a direct link/i)
      .first();
    await searchInput.waitFor({ state: "visible", timeout: 15_000 });
    await searchInput.fill(targetNodeName);
    await expect(getLinkSearchResult(page, targetNodeName)).toBeVisible({
      timeout: 15_000
    });
    await searchInput.press("ArrowDown");
    await searchInput.press("Enter");

    await expect(getLinkedNodeItem(page, targetNodeName)).toBeVisible({
      timeout: 10_000
    });

    await openNodeRecordFromLibrary(page, sourceNodeName);
    await openNodePanel(page, /^Links$/i);
    await expect(getLinkedNodeItem(page, targetNodeName)).toBeVisible({
      timeout: 10_000
    });
  });

  test("link node from node record page after focusing a markdown block and verify reopen persistence", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const token = String(Date.now()).slice(-6);
    const sourceNodeName = `NodeLinkFocusSrc-${token}`;
    const targetNodeName = `NodeLinkFocusTgt-${token}`;

    await e2eSeed.memory.node({ label: targetNodeName });
    await e2eSeed.memory.node({ label: sourceNodeName });
    await openNodeRecordFromLibrary(page, sourceNodeName);

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    const contentTab = page
      .getByRole("tablist")
      .first()
      .getByRole("tab")
      .first();
    await expect(contentTab).toBeVisible({ timeout: 10_000 });
    await contentTab.click({ timeout: 5_000 });
    await expect(contentTab).toHaveAttribute("aria-selected", "true", {
      timeout: 5_000
    });

    const editor = page
      .getByRole("textbox", { name: /Markdown editor/i })
      .or(
        page
          .locator('[contenteditable="true"]')
          .filter({ hasNot: page.locator("#capture-title") })
      )
      .first();
    await editor.waitFor({ state: "visible", timeout: 15_000 });
    await editor.click({ timeout: 5_000 });
    await page.keyboard.type(` Focused ${token}`, { delay: 20 });

    await openNodePanel(page, /^Links$/i);

    const searchInput = page
      .getByRole("complementary")
      .getByPlaceholder(/Start searching to add a direct link/i)
      .first();
    await searchInput.waitFor({ state: "visible", timeout: 15_000 });
    await searchInput.fill(targetNodeName);

    const resultItem = getLinkSearchResult(page, targetNodeName);
    await resultItem.waitFor({ state: "visible", timeout: 15_000 });
    await resultItem.click({ timeout: 5_000 });

    await expect(getLinkedNodeItem(page, targetNodeName)).toBeVisible({
      timeout: 10_000
    });

    await openNodeRecordFromLibrary(page, sourceNodeName);
    await openNodePanel(page, /^Links$/i);
    await expect(getLinkedNodeItem(page, targetNodeName)).toBeVisible({
      timeout: 10_000
    });
    expect(pageErrors).toEqual([]);
  });

  test("open side notes on node record page without props_invalid_value errors", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    const nodeName = `NodeSidenotes-${Date.now()}`;
    await e2eSeed.memory.node({ label: nodeName });
    await openNodeRecordFromLibrary(page, nodeName);
    await openNodePanel(page, /^Side notes$/i);

    await expect(page.getByPlaceholder(/Add notes/i).first()).toBeVisible({
      timeout: 15_000
    });
    expect(
      pageErrors.filter((message) => message.includes("props_invalid_value"))
    ).toEqual([]);
  });

  test("side notes persist after navigating away and reopening node record page", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await ensureInAppOnHome(page);

    const nodeName = `NodeSidenotesPersist-${Date.now()}`;
    const noteText = `Persistent sidenote ${Date.now()}`;
    const node = await e2eSeed.memory.node({ label: nodeName });
    await openNodeRecordFromLibrary(page, nodeName);
    await openNodePanel(page, /^Side notes$/i);

    const notesInput = page.getByPlaceholder(/Add notes/i).first();
    await notesInput.waitFor({ state: "visible", timeout: 15_000 });
    await notesInput.click({ timeout: 5_000 });
    await page.keyboard
      .press(process.platform === "darwin" ? "Meta+A" : "Control+A")
      .catch(() => null);
    await page.keyboard.type(noteText, { delay: 20 });

    await expect(notesInput).toContainText(noteText, {
      timeout: 15_000
    });

    await expect
      .poll(() => readPersistedNodeNotes(page, node.id), {
        message:
          "side notes persist after navigating away and reopening node r...: toContain noteText",
        timeout: 15_000
      })
      .toContain(noteText);

    await openNodeRecordFromLibrary(page, nodeName);
    await openNodePanel(page, /^Side notes$/i);

    await expect(page.getByPlaceholder(/Add notes/i).first()).toContainText(
      noteText,
      {
        timeout: 15_000
      }
    );
  });
});
