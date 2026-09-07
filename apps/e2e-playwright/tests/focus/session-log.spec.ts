import { expect, test, type E2ESeed } from "../fixtures/e2e-test";
import { ensureInAppOnHome, navigateToSurface } from "../utils/helpers";
import { resolveRepoFsImportPath } from "../utils/repo-fs";
import { blockGoogleAccountsNavigation } from "./focus-test-helpers";

let e2eSeed: E2ESeed;

/**
 * Opens the session detail resource surface through the calendar route search params.
 */
async function openSessionDetailPage(
  page: import("@playwright/test").Page,
  sessionId: string
) {
  await page.goto(
    `/calendar?rAt=${Date.now()}&r=${encodeURIComponent(sessionId)}`,
    { waitUntil: "domcontentloaded" }
  );
  await expect(page.getByText("Session details", { exact: true })).toBeVisible({
    timeout: 20_000
  });
}

test.beforeEach(async ({ page, seed }) => {
  e2eSeed = seed;
  await blockGoogleAccountsNavigation(page);
});

test("opens direct session log page and renders totals, interval bar, notes, and expanded focus items @record-page", async ({
  page
}) => {
  test.setTimeout(120_000);

  await ensureInAppOnHome(page);
  const seeded = await e2eSeed.focus.sessionDetail();

  expect(seeded.itemIds).toEqual([
    expect.stringMatching(/^objective:/),
    expect.stringMatching(/^task:/),
    expect.stringMatching(/^task:/)
  ]);

  await openSessionDetailPage(page, seeded.sessionId);

  await expect(page.getByText("Summary", { exact: true })).toBeVisible();
  await expect(page.getByText("Notes", { exact: true })).toBeVisible();
  await expect(page.getByText("Total", { exact: true })).toBeVisible();
  await expect(page.getByText("Focus", { exact: true })).toBeVisible();
  await expect(page.getByText("Break", { exact: true })).toBeVisible();
  await expect(page.getByText("40:00", { exact: true })).toBeVisible();
  await expect(page.getByText("35:00", { exact: true })).toBeVisible();
  await expect(page.getByText("05:00", { exact: true })).toBeVisible();
  await expect(
    page.locator(
      'div[style*="width: 50%"], div[style*="width: 12.5%"], div[style*="width: 37.5%"]'
    )
  ).toHaveCount(3);
  await expect(page.getByText("Focus items", { exact: true })).toBeVisible();
  await expect(
    page.getByText(seeded.objectiveLabel, { exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText(seeded.nestedTaskLabel, { exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText(seeded.standaloneTaskLabel, { exact: true }).first()
  ).toBeVisible();

  await page.getByText("Notes", { exact: true }).click({ timeout: 5_000 });
  await expect(page.getByText(seeded.notesText, { exact: true })).toBeVisible({
    timeout: 15_000
  });
});

test("opens session log from calendar timeline and delete cascades session logs @record-page", async ({
  page
}) => {
  test.setTimeout(120_000);

  await ensureInAppOnHome(page);
  const seeded = await e2eSeed.focus.sessionDetail();

  await navigateToSurface(page, "calendar");
  await page
    .getByRole("button", { name: /^Today$/i })
    .first()
    .click({ timeout: 5_000 })
    .catch(() => null);
  const timelineEntry = page
    .locator("button")
    .filter({ hasText: seeded.objectiveLabel })
    .first();
  await expect(timelineEntry).toBeVisible({ timeout: 20_000 });
  await timelineEntry.click({ timeout: 5_000 });
  await expect(page.getByText("Session details", { exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(
    page.getByText(seeded.nestedTaskLabel, { exact: true }).first()
  ).toBeVisible();

  await page
    .getByRole("button", { name: /^Delete session/i })
    .click({ timeout: 5_000 });
  await expect(
    page.getByText("Are you sure you want to delete this session log?")
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /^Delete/i }).click({
    timeout: 5_000
  });
  await expect(page.getByText("Session details", { exact: true })).toBeHidden({
    timeout: 20_000
  });

  const remaining = await page.evaluate(
    async ({ modulePaths, sessionId, sessionLogIds, itemIds }) => {
      const datafnMod = await import(modulePaths.datafnStorePath);
      const { datafn } = datafnMod;
      const session = await datafn.session.query({
        filters: { id: sessionId },
        limit: 1
      });
      const logs = await datafn.sessionLog.query({
        filters: { id: { $in: sessionLogIds } }
      });
      const objectiveIds = itemIds.filter((id: string) =>
        id.startsWith("objective:")
      );
      const taskIds = itemIds.filter((id: string) => id.startsWith("task:"));
      const objectives = await datafn.objective.query({
        select: ["*", "sessions.*#"],
        filters: { id: { $in: objectiveIds } },
        limit: objectiveIds.length
      });
      const tasks = await datafn.task.query({
        select: ["*", "sessions.*#"],
        filters: { id: { $in: taskIds } },
        limit: taskIds.length
      });
      return {
        sessions: session.data?.length ?? 0,
        logs: logs.data?.length ?? 0,
        objectiveSessionCounts:
          objectives.data?.map(
            (objective: { sessions?: unknown[] }) =>
              objective.sessions?.length ?? 0
          ) ?? [],
        taskSessionCounts:
          tasks.data?.map(
            (task: { sessions?: unknown[] }) => task.sessions?.length ?? 0
          ) ?? []
      };
    },
    {
      sessionId: seeded.sessionId,
      sessionLogIds: seeded.sessionLogIds,
      itemIds: seeded.itemIds,
      modulePaths: {
        datafnStorePath: resolveRepoFsImportPath(
          "client/datafn/datafn.store.ts"
        )
      }
    }
  );
  expect(remaining).toEqual({
    sessions: 0,
    logs: 0,
    objectiveSessionCounts: [0],
    taskSessionCounts: [0, 0]
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await navigateToSurface(page, "calendar");
  await expect(
    page.locator("button").filter({ hasText: seeded.objectiveLabel })
  ).toHaveCount(0);
});
