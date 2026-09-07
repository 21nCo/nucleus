import type { Page } from "@playwright/test";
import { expect, test, type E2ESeed } from "../../fixtures/e2e-test";
import {
  ensureInAppOnHome,
  selectFirstTwoViaContextMenu,
  getBulkEditBar
} from "../../utils/helpers";
import { resolveRepoFsImportPath } from "../../utils/repo-fs";
import {
  getResourceRecordsContainer,
  getResourceThumbnail,
  getResourceThumbnails,
  openResourceBrowser,
  openResourceQueryState,
  requireResourceBrowseContract
} from "../../utils/resource-matrix";

let e2eSeed: E2ESeed;

function getCollectionRecords(page: Page) {
  const contract = requireResourceBrowseContract(
    test.info().project.name,
    "collection"
  );
  return getResourceRecordsContainer(page, contract);
}

function getCollectionThumbnails(page: Page) {
  return getResourceThumbnails(page);
}

async function getSelectedCollectionIds(page: Page) {
  return page.evaluate(
    async ({ modulePaths }) => {
      const bulkEditMod = await import(modulePaths.bulkEditStorePath);
      return bulkEditMod.bulkEditStore.getState().selectedIds as string[];
    },
    {
      modulePaths: {
        bulkEditStorePath: resolveRepoFsImportPath(
          "client/stores/resources/bulkedit.store.ts"
        )
      }
    }
  );
}

async function queryCollectionState(page: Page, ids: string[]) {
  return page.evaluate(
    async ({ modulePaths, ids }) => {
      const datafnMod = await import(modulePaths.datafnStorePath);
      const { datafn } = datafnMod;
      const result = await datafn.collection.query({
        filters: { id: { $in: ids } },
        metadata: {
          includeArchived: true,
          includeTrashed: true
        }
      });
      const rows = result.data ?? [];
      return ids.map((id) => rows.find((row: { id: string }) => row.id === id));
    },
    {
      ids,
      modulePaths: {
        datafnStorePath: resolveRepoFsImportPath(
          "client/datafn/datafn.store.ts"
        )
      }
    }
  );
}

test.describe("collection - bulk editor @bulk-editor", () => {
  test.beforeEach(async ({ page, seed }) => {
    e2eSeed = seed;
    await page.route("**/*", (route) => {
      const reqUrl = route.request().url();
      if (/accounts\.google\.com/i.test(reqUrl)) route.abort();
      else route.continue();
    });
  });

  test("select multiple collections via context menu - bulk edit bar appears and shows count", async ({
    page
  }) => {
    test.setTimeout(90_000);
    await ensureInAppOnHome(page);
    await e2eSeed.collections.collections(2, {
      prefix: "E2E bulk collection"
    });
    await openResourceBrowser(page, test.info().project.name, "collection");

    await selectFirstTwoViaContextMenu(page, "collection");

    await expect(page.getByText(/Selected: 2 collections?/i)).toBeVisible({
      timeout: 10_000
    });
    const bar = getBulkEditBar(page);
    await expect(bar).toBeVisible({ timeout: 5_000 });
    await expect(bar.getByRole("button", { name: /^Star$/i })).toBeVisible();
    await expect(bar.getByRole("button", { name: /^Archive$/i })).toBeVisible();
    await expect(bar.getByRole("button", { name: /^Delete$/i })).toBeVisible();
  });

  test("select multiple collections - clear selection hides bulk edit bar", async ({
    page
  }) => {
    test.setTimeout(90_000);
    await ensureInAppOnHome(page);
    await e2eSeed.collections.collections(2, {
      prefix: "E2E bulk collection"
    });
    await openResourceBrowser(page, test.info().project.name, "collection");

    await selectFirstTwoViaContextMenu(page, "collection");
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeVisible({
      timeout: 10_000
    });

    await getBulkEditBar(page)
      .getByRole("button", { name: /Clear selection/i })
      .click({ timeout: 5_000 });
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeHidden({
      timeout: 5_000
    });
  });

  test("select multiple collections - Star shows success toast, clears selection, and collections are starred", async ({
    page
  }) => {
    test.setTimeout(90_000);
    await ensureInAppOnHome(page);
    await e2eSeed.collections.collections(2, {
      prefix: "E2E bulk collection"
    });
    await openResourceBrowser(page, test.info().project.name, "collection");

    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "starred"
    );
    const starredThumbnailsBefore = getCollectionThumbnails(page);
    await getCollectionRecords(page).waitFor({
      state: "visible",
      timeout: 10_000
    });
    const starredCountBefore = await starredThumbnailsBefore.count();
    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "active"
    );

    await selectFirstTwoViaContextMenu(page, "collection");
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeVisible({
      timeout: 10_000
    });
    const selectedIds = await getSelectedCollectionIds(page);
    expect(selectedIds).toHaveLength(2);

    await getBulkEditBar(page)
      .getByRole("button", { name: /^Star$/i })
      .click({ timeout: 5_000 });
    await expect(
      page.getByText(/Starred 2 collections? successfully/i)
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeHidden({
      timeout: 5_000
    });
    await expect
      .poll(async () => queryCollectionState(page, selectedIds), {
        message:
          "select multiple collections - Star shows success toast, clear...: toEqual [ expect.objectContaining({ id: selectedIds[0], isStarred: true }), expect.objectContaining(",
        timeout: 10_000
      })
      .toEqual([
        expect.objectContaining({ id: selectedIds[0], isStarred: true }),
        expect.objectContaining({ id: selectedIds[1], isStarred: true })
      ]);

    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "starred"
    );
    const thumbnails = getCollectionThumbnails(page);
    await expect(thumbnails.first()).toBeVisible({ timeout: 10_000 });
    await expect(thumbnails).toHaveCount(starredCountBefore + 2, {
      timeout: 5_000
    });
    for (const selectedId of selectedIds) {
      await expect(getResourceThumbnail(page, selectedId)).toBeVisible({
        timeout: 10_000
      });
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureInAppOnHome(page);
    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "starred"
    );
    for (const selectedId of selectedIds) {
      await expect(getResourceThumbnail(page, selectedId)).toBeVisible({
        timeout: 10_000
      });
    }
  });

  test("select multiple collections - Select all keeps bar visible with count", async ({
    page
  }) => {
    test.setTimeout(90_000);
    await ensureInAppOnHome(page);
    await e2eSeed.collections.collections(2, {
      prefix: "E2E bulk collection"
    });
    await openResourceBrowser(page, test.info().project.name, "collection");

    const thumbnails = getCollectionThumbnails(page);
    await expect(thumbnails.first()).toBeVisible({ timeout: 10_000 });
    const totalCount = await thumbnails.count();

    await selectFirstTwoViaContextMenu(page, "collection");
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeVisible({
      timeout: 10_000
    });

    await getBulkEditBar(page)
      .getByRole("button", { name: /Select all/i })
      .click({ timeout: 5_000 });
    await expect(
      page.getByText(new RegExp(`Selected: ${totalCount} collections?`, "i"))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("select multiple collections - Archive shows success toast, clears selection, and collections are archived", async ({
    page
  }) => {
    test.setTimeout(90_000);
    await ensureInAppOnHome(page);
    await e2eSeed.collections.collections(2, {
      prefix: "E2E bulk collection"
    });
    await openResourceBrowser(page, test.info().project.name, "collection");

    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "archived"
    );
    const archivedThumbnailsBefore = getCollectionThumbnails(page);
    await getCollectionRecords(page).waitFor({
      state: "visible",
      timeout: 10_000
    });
    const archivedCountBefore = await archivedThumbnailsBefore.count();
    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "active"
    );

    await selectFirstTwoViaContextMenu(page, "collection");
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeVisible({
      timeout: 10_000
    });
    const selectedIds = await getSelectedCollectionIds(page);
    expect(selectedIds).toHaveLength(2);

    await getBulkEditBar(page)
      .getByRole("button", { name: /^Archive$/i })
      .click({ timeout: 5_000 });
    await expect(
      page.getByText(/Archived 2 collections? successfully/i)
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeHidden({
      timeout: 5_000
    });
    await expect
      .poll(async () => queryCollectionState(page, selectedIds), {
        message:
          "select multiple collections - Archive shows success toast, cl...: toEqual [ expect.objectContaining({ id: selectedIds[0], isArchived: true }), expect.objectContaining",
        timeout: 10_000
      })
      .toEqual([
        expect.objectContaining({ id: selectedIds[0], isArchived: true }),
        expect.objectContaining({ id: selectedIds[1], isArchived: true })
      ]);

    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "archived"
    );
    const thumbnails = getCollectionThumbnails(page);
    await expect(thumbnails.first()).toBeVisible({ timeout: 10_000 });
    await expect(thumbnails).toHaveCount(archivedCountBefore + 2, {
      timeout: 5_000
    });
    for (const selectedId of selectedIds) {
      await expect(getResourceThumbnail(page, selectedId)).toBeVisible({
        timeout: 10_000
      });
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureInAppOnHome(page);
    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "archived"
    );
    for (const selectedId of selectedIds) {
      await expect(getResourceThumbnail(page, selectedId)).toBeVisible({
        timeout: 10_000
      });
    }
  });

  test("select multiple collections - Delete shows success toast and clears selection", async ({
    page
  }) => {
    test.setTimeout(90_000);
    await ensureInAppOnHome(page);
    await e2eSeed.collections.collections(2, {
      prefix: "E2E bulk collection"
    });
    await openResourceBrowser(page, test.info().project.name, "collection");

    const recordsContainer = getCollectionRecords(page);
    await recordsContainer.waitFor({ state: "visible", timeout: 10_000 });
    const thumbnailsBefore = getCollectionThumbnails(page);
    await expect(thumbnailsBefore.first()).toBeVisible({ timeout: 10_000 });
    const countBefore = await thumbnailsBefore.count();

    await selectFirstTwoViaContextMenu(page, "collection");
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeVisible({
      timeout: 10_000
    });
    const selectedIds = await getSelectedCollectionIds(page);
    expect(selectedIds).toHaveLength(2);

    await getBulkEditBar(page)
      .getByRole("button", { name: /^Delete$/i })
      .click({ timeout: 5_000 });
    await expect(
      page.getByText(/Deleted 2 collections? successfully/i)
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Selected: 2 collections?/i)).toBeHidden({
      timeout: 5_000
    });
    await expect
      .poll(async () => queryCollectionState(page, selectedIds), {
        message:
          "select multiple collections - Delete shows success toast and...: toEqual [ expect.objectContaining({ id: selectedIds[0], trashedAt: expect.anything() }), expect.obje",
        timeout: 10_000
      })
      .toEqual([
        expect.objectContaining({
          id: selectedIds[0],
          trashedAt: expect.anything()
        }),
        expect.objectContaining({
          id: selectedIds[1],
          trashedAt: expect.anything()
        })
      ]);

    const thumbnailsAfter = getCollectionThumbnails(page);
    await expect(thumbnailsAfter).toHaveCount(countBefore - 2, {
      timeout: 10_000
    });
    for (const selectedId of selectedIds) {
      await expect(getResourceThumbnail(page, selectedId)).toBeHidden({
        timeout: 10_000
      });
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureInAppOnHome(page);
    await openResourceQueryState(
      page,
      test.info().project.name,
      "collection",
      "active"
    );
    for (const selectedId of selectedIds) {
      await expect(getResourceThumbnail(page, selectedId)).toBeHidden({
        timeout: 10_000
      });
    }
  });
});
