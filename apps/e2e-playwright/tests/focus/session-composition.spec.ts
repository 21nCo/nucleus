import { expect, test, type Locator, type Page } from "@playwright/test";
import { ensureInAppOnHome } from "../utils/helpers";
import { resolveRepoFsImportPath } from "../utils/repo-fs";
import {
  addFocusPreset as addPreset,
  collectPageErrors,
  ensureAdvancedFocus,
  fillDurationInput,
  fillInputValue,
  readSessionRuntime,
  reloadActiveSession,
  removeFocusPreset as removeSavedPreset,
  resetFocusSession,
  selectCustomMode,
  selectDurationTab,
  selectPresetsMode,
  showFocusFullscreen,
  startAdvancedFocus,
  waitForSessionElapsed
} from "./focus-test-helpers";

async function readIntervalBars(page: Page) {
  const previewBar = page
    .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
    .first();
  await expect(previewBar).toBeVisible({ timeout: 15_000 });
  return previewBar.getByTestId("interval-bar-item").evaluateAll((items) =>
    items.map((item) => ({
      duration: Number(item.getAttribute("data-duration")),
      type: item.getAttribute("data-interval-type")
    }))
  );
}

async function readRunningIntervalBars(page: Page) {
  const runningBar = page
    .locator('[data-testid="interval-bar"][data-composition-preview="false"]')
    .first();
  await expect(runningBar).toBeVisible({ timeout: 15_000 });
  return {
    sessionType: await runningBar.getAttribute("data-session-type"),
    intervals: await runningBar
      .getByTestId("interval-bar-item")
      .evaluateAll((items) =>
        items.map((item) => ({
          duration: Number(item.getAttribute("data-duration")),
          progress: Number(item.getAttribute("data-progress")),
          type: item.getAttribute("data-interval-type")
        }))
      )
  };
}

type SessionRuntime = Awaited<ReturnType<typeof readSessionRuntime>>;

function projectRuntimeIntervals(intervals: SessionRuntime["intervals"]) {
  return intervals.map(({ duration, progress, type }) => ({
    duration,
    progress,
    type
  }));
}

function visibleZenMode(page: Page) {
  return page
    .locator('[aria-roledescription="zen mode"]')
    .filter({ visible: true })
    .first();
}

async function expectRunningSessionTotals(page: Page) {
  await expect(async () => {
    const state = await readSessionRuntime(page);
    await expect(
      page
        .getByText(`Session: ${formatClock(state.totalElapsed)}`)
        .filter({ visible: true })
    ).toBeVisible({ timeout: 500 });
    await expect(
      page
        .getByText(`F: ${formatClock(state.focusElapsed)}`)
        .filter({ visible: true })
    ).toBeVisible({ timeout: 500 });
    await expect(
      page
        .getByText(`B: ${formatClock(state.breakElapsed)}`)
        .filter({ visible: true })
    ).toBeVisible({ timeout: 500 });
  }, "running session totals match the rendered UI").toPass({
    timeout: 10_000
  });
}

async function expectRunningFocusDuration(page: Page) {
  await expect(async () => {
    const state = await readSessionRuntime(page);
    await expect(
      page
        .getByText(formatClock(state.timeElapsed), { exact: true })
        .filter({ visible: true })
        .first()
    ).toBeVisible({ timeout: 500 });
    if (
      state.composition?.type === "Focus target" &&
      typeof state.composition.focusDuration === "number"
    ) {
      await expect(
        page
          .getByText(
            `F: ${formatClock(state.focusElapsed)} / ${formatClock(
              state.composition.focusDuration
            )}`,
            { exact: true }
          )
          .filter({ visible: true })
          .first()
      ).toBeVisible({ timeout: 500 });
    }
  }, "running focus duration matches the rendered UI").toPass({
    timeout: 10_000
  });
}

async function expectRunningFocusControls(page: Page, sessionType: string) {
  await expect(
    page.getByRole("button", { name: /^Finish$/i }).filter({ visible: true })
  ).toBeVisible({ timeout: 15_000 });
  if (sessionType === "PREDEFINED_INTERVALS") {
    await expect(
      page.getByRole("button", { name: /^Abandon$/i }).filter({ visible: true })
    ).toBeVisible({ timeout: 15_000 });
    return;
  }
  await expect(
    page.getByRole("button", { name: /^Break$/i }).filter({ visible: true })
  ).toBeVisible({ timeout: 15_000 });
}

async function expectRestoredRunningIntervalBars(
  page: Page,
  expected: Awaited<ReturnType<typeof readSessionRuntime>>
) {
  await expect
    .poll(
      async () => {
        const runningBars = await readRunningIntervalBars(page);
        if (runningBars.sessionType !== expected.type) return null;
        if (runningBars.intervals.length !== expected.intervals.length) {
          return null;
        }
        const matchesShape = expected.intervals.every((interval, index) => {
          const actual = runningBars.intervals[index];
          const type =
            interval.type === 1
              ? "focus"
              : interval.type === 0
                ? "break"
                : "none";
          if (!actual || actual.type !== type) return false;
          if (expected.type === "COUNTUP") {
            return typeof actual.duration === "number";
          }
          return actual.duration === interval.duration;
        });
        if (!matchesShape) return null;
        if ((expected.intervals[0]?.progress ?? 0) > 0) {
          if (!(runningBars.intervals[0]?.progress > 0)) return null;
        }
        return runningBars;
      },
      {
        message:
          "expectRestoredRunningIntervalBars: reaches its expected value",
        timeout: 15_000
      }
    )
    .not.toBeNull();
}

function expectPlannedEndNearStart(
  state: Awaited<ReturnType<typeof readSessionRuntime>>
) {
  expect(state.start).toBeTruthy();
  expect(state.end).toBeTruthy();
  const startMs = state.start!;
  const endMs = state.end!;
  expect(Math.abs(endMs - startMs - state.plannedDuration * 1000)).toBeLessThan(
    2_000
  );
}

function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  const mm = minutes.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

function getCustomPomodoroUnit(page: Page, index = 0) {
  return page.locator("div.userdata.border-2").nth(index);
}

async function ensurePomodoroDurationMinutes(page: Page, unitButton: Locator) {
  await expect(unitButton).toBeVisible({ timeout: 10_000 });
  const currentUnit = (await unitButton.innerText()).trim().toLowerCase();
  if (currentUnit.includes("minutes")) {
    return;
  }
  await unitButton.click();
  await page
    .getByRole("button", { name: /^minutes$/i })
    .last()
    .click({ timeout: 5_000 });
  await expect(unitButton).toContainText(/minutes/i, { timeout: 10_000 });
}

async function fillCustomPomodoroFields(
  page: Page,
  values: { rounds: string; focusDuration: string; breakDuration: string },
  unitIndex = 0
) {
  const unit = getCustomPomodoroUnit(page, unitIndex);
  await expect(unit).toBeVisible({ timeout: 15_000 });
  await fillInputValue(unit.getByPlaceholder("rounds").first(), values.rounds);

  const durationUnitButtons = unit.getByRole("button", {
    name: /^(minutes|hours)$/i
  });
  await ensurePomodoroDurationMinutes(page, durationUnitButtons.nth(0));
  await fillInputValue(
    unit.getByPlaceholder("Duration").nth(0),
    values.focusDuration
  );
  await ensurePomodoroDurationMinutes(page, durationUnitButtons.nth(1));
  await fillInputValue(
    unit.getByPlaceholder("Duration").nth(1),
    values.breakDuration
  );
}

async function expectPreviewSessionType(page: Page, sessionType: string) {
  const previewBar = page
    .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
    .first();
  await expect(previewBar).toBeVisible({ timeout: 15_000 });
  await expect(previewBar).toHaveAttribute("data-session-type", sessionType);
}

async function expectComposeClockLabels(page: Page) {
  await expect(page.getByText("Now", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
  await expect(
    page
      .getByRole("button")
      .filter({ hasText: /\d{1,2}:\d{2}/ })
      .first()
  ).toBeVisible();
  await expect(page.getByRole("button").filter({ hasText: "♾️" })).toHaveCount(
    0
  );
}

async function expectRunningFocusChrome(page: Page) {
  const sessionType = (await readSessionRuntime(page)).type;
  await expect(
    page.getByText("Start", { exact: true }).filter({ visible: true })
  ).toBeVisible();
  if (sessionType === "COUNTUP") {
    await expect(
      page.getByText("Now", { exact: true }).filter({ visible: true })
    ).toBeVisible();
  } else {
    await expect(
      page.getByText("End", { exact: true }).filter({ visible: true })
    ).toBeVisible();
  }
  await expect(
    page.getByText(/CURRENT FOCUS/i).filter({ visible: true })
  ).toBeVisible();
  await expectRunningFocusDuration(page);
  await expectRunningSessionTotals(page);
  await expectRunningFocusControls(page, sessionType);
}

async function reloadAndExpectRunningComposition(
  page: Page,
  expected: Awaited<ReturnType<typeof readSessionRuntime>>
) {
  await reloadActiveSession(page);
  await expect
    .poll(async () => (await readSessionRuntime(page)).isSessionRunning, {
      message: "reloadAndExpectRunningComposition: toBe true",
      timeout: 15_000
    })
    .toBe(true);
  const fullScreen = visibleZenMode(page);
  if (!(await fullScreen.isVisible().catch(() => false))) {
    await showFocusFullscreen(page);
  }
  await expect(visibleZenMode(page)).toBeVisible({ timeout: 15_000 });
  await expectRestoredRunningIntervalBars(page, expected);
  await expectRunningFocusChrome(page);
  const restored = await readSessionRuntime(page);
  expect(restored).toMatchObject({
    composition: expected.composition,
    isSessionRunning: true,
    plannedDuration: expected.plannedDuration,
    type: expected.type
  });
}

async function openEndTimeComposer(page: Page) {
  const previewBar = page
    .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
    .first();
  await expect(previewBar).toBeVisible({ timeout: 15_000 });
  await previewBar.locator(".items-end").getByRole("button").first().click({
    timeout: 5_000
  });
}

async function readAdvancedCompositionDraft(page: Page) {
  return page.evaluate(
    async ({ modulePath }) => {
      const draftMod = await import(modulePath);
      let draft: any;
      const unsubscribe = draftMod.advancedCompositionDraft.subscribe(
        (value: any) => {
          draft = value;
        }
      );
      unsubscribe();
      return draft
        ? {
            type: draft.type,
            breakType: draft.breakType
          }
        : null;
    },
    {
      modulePath: resolveRepoFsImportPath(
        "client/features/focus/advanced/composition/advancedCompositionDraft.store.ts"
      )
    }
  );
}

test.beforeEach(async ({ page }) => {
  await ensureInAppOnHome(page);
  await resetFocusSession(page);
});

test.afterEach(async ({ page }) => {
  await resetFocusSession(page).catch(() => null);
});

test("countup starts a countup session", async ({ page }) => {
  test.setTimeout(90_000);
  const pageErrors = collectPageErrors(page);

  await ensureAdvancedFocus(page);
  await selectCustomMode(page);
  await selectDurationTab(page, "Countup");

  const previewBar = page
    .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
    .first();
  await expect(previewBar).toBeVisible({ timeout: 15_000 });
  await expect(previewBar).toHaveAttribute("data-session-type", "COUNTUP");
  await expect(page.getByText("Now", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("button").filter({ hasText: "♾️" }).first()
  ).toBeVisible();
  await expect(page.getByText("Total:").first()).toContainText("∞");
  await expect(page.getByText("Focus:").first()).toContainText("∞");

  await startAdvancedFocus(page);
  await waitForSessionElapsed(page, 2);

  const activeSessionState = await readSessionRuntime(page);
  expect(activeSessionState).toMatchObject({
    composition: {
      type: "Countup"
    },
    isSessionRunning: true,
    plannedDuration: 0,
    state: 1,
    type: "COUNTUP"
  });
  expect(activeSessionState.start).toBeTruthy();
  expect(Math.floor(activeSessionState.totalElapsed)).toBeGreaterThanOrEqual(2);
  expect(Math.floor(activeSessionState.timeElapsed)).toBeGreaterThanOrEqual(2);
  expect(activeSessionState.focusElapsed).toBeGreaterThanOrEqual(1);
  expect(activeSessionState.breakElapsed).toBe(0);
  expect(activeSessionState.totalIdle).toBe(0);
  expect(
    Math.abs(activeSessionState.focusElapsed - activeSessionState.totalElapsed)
  ).toBeLessThan(2);
  expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
    expect.objectContaining({
      type: 1,
      progress: 1,
      duration: expect.any(Number)
    })
  ]);
  expect(activeSessionState.intervals[0].duration).toBeGreaterThanOrEqual(1);

  await expect(page.getByText("Start", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Now", { exact: true }).first()).toBeVisible();
  await expectRunningSessionTotals(page);
  await reloadAndExpectRunningComposition(page, activeSessionState);
  expect(pageErrors).toEqual([]);
});

test("countdown without predefined breaks starts a plain countdown session", async ({
  page
}) => {
  test.setTimeout(90_000);
  const pageErrors = collectPageErrors(page);
  const totalDuration = 60 * 60;

  await ensureAdvancedFocus(page);
  await selectCustomMode(page);
  await selectDurationTab(page, "Countdown");
  await fillDurationInput(page, "advanced-focus-total-duration", "1");

  const previewBar = page
    .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
    .first();
  await expect(previewBar).toBeVisible({ timeout: 15_000 });
  await expect(previewBar).toHaveAttribute("data-session-type", "COUNTDOWN");
  await expect
    .poll(() => readIntervalBars(page), {
      message:
        'countdown without predefined breaks starts a plain countdown...: toEqual [{ type: "focus", duration: totalDuration }]',
      timeout: 15_000
    })
    .toEqual([{ type: "focus", duration: totalDuration }]);
  await expect(page.getByText("Now", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
  await expect(
    page
      .getByRole("button")
      .filter({ hasText: /\d{1,2}:\d{2}/ })
      .first()
  ).toBeVisible();
  await expect(page.getByRole("button").filter({ hasText: "♾️" })).toHaveCount(
    0
  );
  await expect(page.getByText("Total:").first()).toContainText("1 h");
  await expect(page.getByText("Focus:").first()).toContainText("1 h");
  await expect(page.getByText(/Break:\s*NA/)).toBeVisible();

  await startAdvancedFocus(page);
  await waitForSessionElapsed(page, 2);

  const activeSessionState = await readSessionRuntime(page);
  expect(activeSessionState).toMatchObject({
    composition: {
      breakType: "Reminder",
      totalDuration,
      type: "Total duration"
    },
    isSessionRunning: true,
    plannedDuration: totalDuration,
    state: 1,
    type: "COUNTDOWN"
  });
  expectPlannedEndNearStart(activeSessionState);
  expect(Math.floor(activeSessionState.totalElapsed)).toBeGreaterThanOrEqual(2);
  expect(Math.floor(activeSessionState.timeElapsed)).toBeGreaterThanOrEqual(1);
  expect(activeSessionState.focusElapsed).toBeGreaterThanOrEqual(1);
  expect(activeSessionState.breakElapsed).toBe(0);
  expect(activeSessionState.totalIdle).toBe(0);
  expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
    expect.objectContaining({
      type: 1,
      duration: totalDuration,
      progress: expect.any(Number)
    })
  ]);
  expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);
  expect(activeSessionState.intervals[0].progress).toBeLessThan(0.05);

  const runningBars = await readRunningIntervalBars(page);
  expect(runningBars.sessionType).toBe("COUNTDOWN");
  expect(runningBars.intervals).toEqual([
    expect.objectContaining({
      type: "focus",
      duration: totalDuration,
      progress: expect.any(Number)
    })
  ]);
  expect(runningBars.intervals[0].progress).toBeGreaterThan(0);

  await expect(page.getByText("Start", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/CURRENT FOCUS/i).first()).toBeVisible();
  await expectRunningSessionTotals(page);
  await reloadAndExpectRunningComposition(page, activeSessionState);
  expect(pageErrors).toEqual([]);
});

test("countdown predefined break updates preview bars and started session", async ({
  page
}) => {
  test.setTimeout(120_000);
  const pageErrors = collectPageErrors(page);
  const totalDuration = 60 * 60;
  const breakDuration = 5 * 60;
  const focusDuration = 27.5 * 60;

  await ensureAdvancedFocus(page);
  await selectCustomMode(page);
  await selectDurationTab(page, "Countdown");
  await fillDurationInput(page, "advanced-focus-total-duration", "1");
  await page.getByRole("button", { name: "Predefined" }).click();
  await page.getByTestId("advanced-focus-number-of-breaks").fill("1");
  await fillDurationInput(page, "advanced-focus-break-duration", "5");

  const previewBar = page
    .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
    .first();
  await expect(previewBar).toBeVisible({ timeout: 15_000 });
  await expect(previewBar).toHaveAttribute(
    "data-session-type",
    "PREDEFINED_INTERVALS"
  );
  await expect
    .poll(() => readIntervalBars(page), {
      message:
        'countdown predefined break updates preview bars and started s...: toEqual [ { type: "focus", duration: focusDuration }, { type: "break", duration: breakDuration }, { ',
      timeout: 15_000
    })
    .toEqual([
      { type: "focus", duration: focusDuration },
      { type: "break", duration: breakDuration },
      { type: "focus", duration: focusDuration }
    ]);
  await expect(page.getByText("Now", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
  await expect(
    page
      .getByRole("button")
      .filter({ hasText: /\d{1,2}:\d{2}/ })
      .first()
  ).toBeVisible();
  await expect(page.getByRole("button").filter({ hasText: "♾️" })).toHaveCount(
    0
  );
  await expect(page.getByText("Total:").first()).toContainText("1 h");
  await expect(page.getByText("Focus:").first()).toContainText("55 m");
  await expect(page.getByText(/Break:\s*5 m/)).toBeVisible();

  await startAdvancedFocus(page);
  await waitForSessionElapsed(page, 2);

  const activeSessionState = await readSessionRuntime(page);
  expect(activeSessionState).toMatchObject({
    composition: {
      breakDuration,
      breakType: "Predefined",
      numberOfBreaks: 1,
      totalDuration,
      type: "Total duration"
    },
    isSessionRunning: true,
    plannedDuration: totalDuration,
    state: 1,
    type: "PREDEFINED_INTERVALS"
  });
  expectPlannedEndNearStart(activeSessionState);
  expect(Math.floor(activeSessionState.totalElapsed)).toBeGreaterThanOrEqual(2);
  expect(Math.floor(activeSessionState.timeElapsed)).toBeGreaterThanOrEqual(1);
  expect(activeSessionState.focusElapsed).toBeGreaterThanOrEqual(1);
  expect(activeSessionState.breakElapsed).toBe(0);
  expect(activeSessionState.totalIdle).toBe(0);
  expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
    expect.objectContaining({
      type: 1,
      duration: focusDuration,
      progress: expect.any(Number)
    }),
    { type: 0, duration: breakDuration, progress: 0 },
    { type: 1, duration: focusDuration, progress: 0 }
  ]);
  expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);
  expect(activeSessionState.intervals[0].progress).toBeLessThan(0.05);

  const runningBars = await readRunningIntervalBars(page);
  expect(runningBars.sessionType).toBe("PREDEFINED_INTERVALS");
  expect(runningBars.intervals).toEqual([
    expect.objectContaining({
      type: "focus",
      duration: focusDuration,
      progress: expect.any(Number)
    }),
    { type: "break", duration: breakDuration, progress: 0 },
    { type: "focus", duration: focusDuration, progress: 0 }
  ]);
  expect(runningBars.intervals[0].progress).toBeGreaterThan(0);

  await expect(page.getByText("Start", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/CURRENT FOCUS/i).first()).toBeVisible();
  await expectRunningSessionTotals(page);
  await reloadAndExpectRunningComposition(page, activeSessionState);
  expect(pageErrors).toEqual([]);
});

test("countdown with reminder configures remind-every and starts", async ({
  page
}) => {
  test.setTimeout(90_000);
  const pageErrors = collectPageErrors(page);
  const totalDuration = 60 * 60;
  const breakReminder = 10 * 60;

  await ensureAdvancedFocus(page);
  await selectCustomMode(page);
  await selectDurationTab(page, "Countdown");
  await fillDurationInput(page, "advanced-focus-total-duration", "1");
  await page.getByRole("button", { name: /^Reminder$/i }).click();
  await fillDurationInput(page, "advanced-focus-break-reminder", "10");

  await expectPreviewSessionType(page, "COUNTDOWN");
  await expect
    .poll(() => readIntervalBars(page), {
      message:
        'countdown with reminder configures remind-every and starts: toEqual [{ type: "focus", duration: totalDuration }]',
      timeout: 15_000
    })
    .toEqual([{ type: "focus", duration: totalDuration }]);
  await expectComposeClockLabels(page);
  await expect(page.getByText("Total:").first()).toContainText("1 h");
  await expect(page.getByText("Focus:").first()).toContainText("1 h");
  await expect(page.getByText(/Break:\s*NA/)).toBeVisible();
  await expect(
    page.getByTestId("advanced-focus-break-reminder").locator("input").first()
  ).toHaveValue("10");

  await startAdvancedFocus(page);
  await waitForSessionElapsed(page, 2);

  const activeSessionState = await readSessionRuntime(page);
  expect(activeSessionState).toMatchObject({
    composition: {
      breakReminder,
      breakType: "Reminder",
      totalDuration,
      type: "Total duration"
    },
    isSessionRunning: true,
    plannedDuration: totalDuration,
    state: 1,
    type: "COUNTDOWN"
  });
  expectPlannedEndNearStart(activeSessionState);
  expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
    expect.objectContaining({
      type: 1,
      duration: totalDuration,
      progress: expect.any(Number)
    })
  ]);
  expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);

  const runningBars = await readRunningIntervalBars(page);
  expect(runningBars.sessionType).toBe("COUNTDOWN");
  expect(runningBars.intervals).toEqual([
    expect.objectContaining({
      type: "focus",
      duration: totalDuration,
      progress: expect.any(Number)
    })
  ]);
  await expectRunningFocusChrome(page);
  await reloadAndExpectRunningComposition(page, activeSessionState);
  expect(pageErrors).toEqual([]);
});

test("fixed end time replaces compose panel, clear restores presets, and starts a countdown session", async ({
  page
}) => {
  test.setTimeout(90_000);
  const pageErrors = collectPageErrors(page);

  await ensureAdvancedFocus(page);
  await selectPresetsMode(page);
  await openEndTimeComposer(page);

  const endTimeModal = page.locator("#SELECT_END_TIME-modal");
  await expect(endTimeModal).toBeVisible({ timeout: 15_000 });
  await expect(endTimeModal.getByText("Choose end time")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(endTimeModal).toBeHidden({ timeout: 10_000 });

  await expect(page.getByTestId("composition-end-time-selected")).toBeVisible({
    timeout: 15_000
  });
  await expect(page.getByTestId("composition-clear-end-time")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Presets$/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Custom$/i })).toHaveCount(0);
  await expect(page.getByTestId("composition-mode-list")).toHaveCount(0);
  await expect
    .poll(() => readAdvancedCompositionDraft(page), {
      message:
        'fixed end time replaces compose panel, clear restores presets...: toMatchObject { type: "End time" }',
      timeout: 15_000
    })
    .toMatchObject({ type: "End time" });
  await expectPreviewSessionType(page, "COUNTDOWN");
  await expect(page.getByText("Total:").first()).not.toContainText("∞");
  await expect(page.getByText("Focus:").first()).not.toContainText("∞");

  await page.getByTestId("composition-clear-end-time").click();
  await expect(page.getByTestId("composition-end-time-selected")).toBeHidden({
    timeout: 15_000
  });
  await expect(
    page.getByRole("button", { name: /^Presets$/i }).first()
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Custom$/i }).first()
  ).toBeVisible();
  await expect
    .poll(() => readAdvancedCompositionDraft(page), {
      message:
        'fixed end time replaces compose panel, clear restores presets...: toMatchObject { type: "Countup" }',
      timeout: 15_000
    })
    .toMatchObject({ type: "Countup" });

  const clearedState = await readSessionRuntime(page);
  expect(clearedState.composition.type).toBe("Countup");
  expect(clearedState.end).toBeUndefined();
  expect(clearedState.type).toBe("COUNTUP");

  await openEndTimeComposer(page);
  await expect(endTimeModal).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");
  await expect(endTimeModal).toBeHidden({ timeout: 10_000 });
  await expect(page.getByTestId("composition-end-time-selected")).toBeVisible({
    timeout: 15_000
  });

  await startAdvancedFocus(page);
  await waitForSessionElapsed(page, 2);

  const activeSessionState = await readSessionRuntime(page);
  expect(activeSessionState).toMatchObject({
    composition: {
      type: "End time"
    },
    isSessionRunning: true,
    state: 1,
    type: "COUNTDOWN"
  });
  expect(activeSessionState.end).toBeTruthy();
  expect(activeSessionState.plannedDuration).toBeGreaterThan(60);
  expect(activeSessionState.plannedDuration).toBeLessThanOrEqual(90 * 60);
  expectPlannedEndNearStart(activeSessionState);
  expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
    expect.objectContaining({
      type: 1,
      duration: expect.any(Number),
      progress: expect.any(Number)
    })
  ]);
  expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);

  const runningBars = await readRunningIntervalBars(page);
  expect(runningBars.sessionType).toBe("COUNTDOWN");
  expect(runningBars.intervals).toEqual([
    expect.objectContaining({
      type: "focus",
      duration: expect.any(Number),
      progress: expect.any(Number)
    })
  ]);
  await expectRunningFocusChrome(page);
  await reloadAndExpectRunningComposition(page, activeSessionState);
  expect(pageErrors).toEqual([]);
});

test("target focus without predefined breaks starts a target-focus countdown", async ({
  page
}) => {
  test.setTimeout(90_000);
  const pageErrors = collectPageErrors(page);
  const focusDuration = 60 * 60;

  await ensureAdvancedFocus(page);
  await selectCustomMode(page);
  await selectDurationTab(page, "Target duration");
  await fillDurationInput(page, "advanced-focus-target-duration", "1");

  await expectPreviewSessionType(page, "COUNTDOWN");
  await expect
    .poll(() => readIntervalBars(page), {
      message:
        'target focus without predefined breaks starts a target-focus...: toEqual [{ type: "focus", duration: focusDuration }]',
      timeout: 15_000
    })
    .toEqual([{ type: "focus", duration: focusDuration }]);
  await expectComposeClockLabels(page);
  await expect(page.getByText("Total:").first()).toContainText("1 h");
  await expect(page.getByText("Focus:").first()).toContainText("1 h");
  await expect(page.getByText(/Break:\s*NA/)).toBeVisible();

  await startAdvancedFocus(page);
  await waitForSessionElapsed(page, 2);

  const activeSessionState = await readSessionRuntime(page);
  expect(activeSessionState).toMatchObject({
    composition: {
      breakType: "Reminder",
      focusDuration,
      type: "Focus target"
    },
    isSessionRunning: true,
    plannedDuration: focusDuration,
    state: 1,
    type: "COUNTDOWN"
  });
  expect(activeSessionState.start).toBeTruthy();
  expect(Math.floor(activeSessionState.totalElapsed)).toBeGreaterThanOrEqual(2);
  expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
    expect.objectContaining({
      type: 1,
      duration: focusDuration,
      progress: expect.any(Number)
    })
  ]);
  expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);

  const runningBars = await readRunningIntervalBars(page);
  expect(runningBars.sessionType).toBe("COUNTDOWN");
  expect(runningBars.intervals).toEqual([
    expect.objectContaining({
      type: "focus",
      duration: focusDuration,
      progress: expect.any(Number)
    })
  ]);
  await expectRunningFocusChrome(page);
  await reloadAndExpectRunningComposition(page, activeSessionState);
  expect(pageErrors).toEqual([]);
});

test("pomodoro starts a predefined-interval session", async ({ page }) => {
  test.setTimeout(90_000);
  const pageErrors = collectPageErrors(page);
  const focusDuration = 15 * 60;
  const breakDuration = 3 * 60;
  const numberOfFocusRounds = 2;
  const plannedDuration =
    numberOfFocusRounds * focusDuration +
    (numberOfFocusRounds - 1) * breakDuration;
  const expectedBars = [
    { type: "focus", duration: focusDuration },
    { type: "break", duration: breakDuration },
    { type: "focus", duration: focusDuration }
  ];

  await ensureAdvancedFocus(page);
  await selectCustomMode(page);
  await selectDurationTab(page, "Pomodoro");
  await fillCustomPomodoroFields(page, {
    rounds: "2",
    focusDuration: "15",
    breakDuration: "3"
  });

  await expectPreviewSessionType(page, "PREDEFINED_INTERVALS");
  await expect
    .poll(() => readIntervalBars(page), {
      message:
        "pomodoro starts a predefined-interval session: toEqual expectedBars",
      timeout: 15_000
    })
    .toEqual(expectedBars);
  await expectComposeClockLabels(page);
  await expect(page.getByText("Total:").first()).toContainText("33 m");
  await expect(page.getByText("Focus:").first()).toContainText("30 m");
  await expect(page.getByText("Break:").first()).toContainText("3 m");

  await startAdvancedFocus(page);
  await waitForSessionElapsed(page, 2);

  const activeSessionState = await readSessionRuntime(page);
  expect(activeSessionState).toMatchObject({
    composition: {
      breakDuration,
      breakType: "Predefined",
      focusDuration,
      numberOfFocusRounds,
      type: "Pomodoro"
    },
    isSessionRunning: true,
    plannedDuration,
    state: 1,
    type: "PREDEFINED_INTERVALS"
  });
  expectPlannedEndNearStart(activeSessionState);
  expect(Math.floor(activeSessionState.totalElapsed)).toBeGreaterThanOrEqual(2);
  expect(activeSessionState.focusElapsed).toBeGreaterThanOrEqual(1);
  expect(activeSessionState.breakElapsed).toBe(0);
  expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
    expect.objectContaining({
      type: 1,
      duration: focusDuration,
      progress: expect.any(Number)
    }),
    { type: 0, duration: breakDuration, progress: 0 },
    { type: 1, duration: focusDuration, progress: 0 }
  ]);
  expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);

  const runningBars = await readRunningIntervalBars(page);
  expect(runningBars.sessionType).toBe("PREDEFINED_INTERVALS");
  expect(runningBars.intervals).toEqual([
    expect.objectContaining({
      type: "focus",
      duration: focusDuration,
      progress: expect.any(Number)
    }),
    { type: "break", duration: breakDuration, progress: 0 },
    { type: "focus", duration: focusDuration, progress: 0 }
  ]);
  expect(runningBars.intervals[0].progress).toBeGreaterThan(0);
  await expectRunningFocusChrome(page);
  await reloadAndExpectRunningComposition(page, activeSessionState);
  expect(pageErrors).toEqual([]);
});

test("pomodoro with an additional round extends preview and started session", async ({
  page
}) => {
  test.setTimeout(120_000);
  const pageErrors = collectPageErrors(page);
  const primaryFocus = 20 * 60;
  const primaryBreak = 5 * 60;
  const additionalFocus = 28 * 60;
  const additionalBreak = 2 * 60;
  const expectedBars = [
    { type: "focus", duration: primaryFocus },
    { type: "break", duration: primaryBreak },
    { type: "focus", duration: additionalFocus },
    { type: "break", duration: additionalBreak },
    { type: "focus", duration: additionalFocus }
  ];
  const plannedDuration = expectedBars.reduce(
    (sum, bar) => sum + bar.duration,
    0
  );

  await ensureAdvancedFocus(page);
  await selectCustomMode(page);
  await selectDurationTab(page, "Pomodoro");
  await fillCustomPomodoroFields(page, {
    rounds: "1",
    focusDuration: "20",
    breakDuration: "5"
  });
  await page
    .getByRole("button", { name: /add another round/i })
    .click({ timeout: 5_000 });
  await expect(getCustomPomodoroUnit(page, 1)).toBeVisible({ timeout: 15_000 });

  await expectPreviewSessionType(page, "PREDEFINED_INTERVALS");
  await expect
    .poll(() => readIntervalBars(page), {
      message:
        "pomodoro with an additional round extends preview and started...: toEqual expectedBars",
      timeout: 15_000
    })
    .toEqual(expectedBars);
  await expectComposeClockLabels(page);
  await expect(page.getByText("Total:").first()).toContainText("1 h 23 m");
  await expect(page.getByText("Focus:").first()).toContainText("1 h 16 m");
  await expect(page.getByText("Break:").first()).toContainText("7 m");

  await startAdvancedFocus(page);
  await waitForSessionElapsed(page, 2);

  const activeSessionState = await readSessionRuntime(page);
  expect(activeSessionState).toMatchObject({
    composition: {
      breakDuration: primaryBreak,
      focusDuration: primaryFocus,
      numberOfFocusRounds: 1,
      type: "Pomodoro",
      additional: [
        expect.objectContaining({
          breakDuration: additionalBreak,
          focusDuration: additionalFocus,
          numberOfFocusRounds: 2,
          type: "Pomodoro"
        })
      ]
    },
    isSessionRunning: true,
    plannedDuration,
    state: 1,
    type: "PREDEFINED_INTERVALS"
  });
  expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
    expect.objectContaining({
      type: 1,
      duration: primaryFocus,
      progress: expect.any(Number)
    }),
    { type: 0, duration: primaryBreak, progress: 0 },
    { type: 1, duration: additionalFocus, progress: 0 },
    { type: 0, duration: additionalBreak, progress: 0 },
    { type: 1, duration: additionalFocus, progress: 0 }
  ]);
  expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);

  const runningBars = await readRunningIntervalBars(page);
  expect(runningBars.sessionType).toBe("PREDEFINED_INTERVALS");
  expect(runningBars.intervals).toEqual([
    expect.objectContaining({
      type: "focus",
      duration: primaryFocus,
      progress: expect.any(Number)
    }),
    { type: "break", duration: primaryBreak, progress: 0 },
    { type: "focus", duration: additionalFocus, progress: 0 },
    { type: "break", duration: additionalBreak, progress: 0 },
    { type: "focus", duration: additionalFocus, progress: 0 }
  ]);
  await expectRunningFocusChrome(page);
  await reloadAndExpectRunningComposition(page, activeSessionState);
  expect(pageErrors).toEqual([]);
});

test("preset selection applies a pomodoro composition", async ({ page }) => {
  test.setTimeout(90_000);
  const pageErrors = collectPageErrors(page);
  const presetName = `E2E pomodoro preset ${Date.now()}`;
  const focusDuration = 12 * 60;
  const breakDuration = 1 * 60;
  const numberOfFocusRounds = 3;
  const plannedDuration =
    numberOfFocusRounds * focusDuration +
    (numberOfFocusRounds - 1) * breakDuration;
  const expectedPreviewBars = [
    { type: "focus", duration: focusDuration },
    { type: "break", duration: breakDuration },
    { type: "focus", duration: focusDuration },
    { type: "break", duration: breakDuration },
    { type: "focus", duration: focusDuration }
  ];
  const presetId = await addPreset(
    page,
    {
      name: presetName,
      type: "Pomodoro",
      numberOfFocusRounds,
      focusDuration,
      breakDuration,
      totalDuration: 0,
      breakReminder: 10 * 60,
      numberOfBreaks: 1,
      breakType: "Predefined"
    },
    { idPrefix: "e2e_saved_preset" }
  );

  try {
    await ensureAdvancedFocus(page);
    await selectPresetsMode(page);
    const preset = page
      .locator("button.userdata")
      .filter({ hasText: presetName });
    await expect(preset).toBeVisible({ timeout: 15_000 });
    await preset.click({ timeout: 5_000 });

    await expect(preset).toHaveClass(/bg-aps1/, { timeout: 10_000 });
    const previewBar = page
      .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
      .first();
    await expect(previewBar).toBeVisible({ timeout: 15_000 });
    await expect(previewBar).toHaveAttribute(
      "data-session-type",
      "PREDEFINED_INTERVALS"
    );
    await expect
      .poll(() => readIntervalBars(page), {
        message:
          "preset selection applies a pomodoro composition: toEqual expectedPreviewBars",
        timeout: 15_000
      })
      .toEqual(expectedPreviewBars);
    await expect(page.getByText("Now", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
    await expect(
      page
        .getByRole("button")
        .filter({ hasText: /\d{1,2}:\d{2}/ })
        .first()
    ).toBeVisible();
    await expect(page.getByText("Total:").first()).toContainText("38 m");
    await expect(page.getByText("Focus:").first()).toContainText("36 m");
    await expect(page.getByText("Break:").first()).toContainText("2 m");

    await startAdvancedFocus(page);
    await waitForSessionElapsed(page, 2);

    const activeSessionState = await readSessionRuntime(page);
    expect(activeSessionState).toMatchObject({
      composition: {
        breakDuration,
        breakType: "Predefined",
        name: presetName,
        numberOfFocusRounds,
        type: "Pomodoro"
      },
      isSessionRunning: true,
      plannedDuration,
      state: 1,
      type: "PREDEFINED_INTERVALS"
    });
    expectPlannedEndNearStart(activeSessionState);
    expect(Math.floor(activeSessionState.totalElapsed)).toBeGreaterThanOrEqual(
      2
    );
    expect(Math.floor(activeSessionState.timeElapsed)).toBeGreaterThanOrEqual(
      1
    );
    expect(activeSessionState.focusElapsed).toBeGreaterThanOrEqual(1);
    expect(activeSessionState.breakElapsed).toBe(0);
    expect(activeSessionState.totalIdle).toBe(0);
    expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
      expect.objectContaining({
        type: 1,
        duration: focusDuration,
        progress: expect.any(Number)
      }),
      { type: 0, duration: breakDuration, progress: 0 },
      { type: 1, duration: focusDuration, progress: 0 },
      { type: 0, duration: breakDuration, progress: 0 },
      { type: 1, duration: focusDuration, progress: 0 }
    ]);
    expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);
    expect(activeSessionState.intervals[0].progress).toBeLessThan(0.05);

    const runningBars = await readRunningIntervalBars(page);
    expect(runningBars.sessionType).toBe("PREDEFINED_INTERVALS");
    expect(runningBars.intervals).toEqual([
      expect.objectContaining({
        type: "focus",
        duration: focusDuration,
        progress: expect.any(Number)
      }),
      { type: "break", duration: breakDuration, progress: 0 },
      { type: "focus", duration: focusDuration, progress: 0 },
      { type: "break", duration: breakDuration, progress: 0 },
      { type: "focus", duration: focusDuration, progress: 0 }
    ]);
    expect(runningBars.intervals[0].progress).toBeGreaterThan(0);

    await expect(
      page.getByText("Start", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/CURRENT FOCUS/i).first()).toBeVisible();
    await expectRunningSessionTotals(page);
    await reloadAndExpectRunningComposition(page, activeSessionState);
    expect(pageErrors).toEqual([]);
  } finally {
    await removeSavedPreset(page, presetId).catch(() => null);
  }
});

test("saved preset appears in presets and starts with its composition", async ({
  page
}) => {
  test.setTimeout(90_000);
  const pageErrors = collectPageErrors(page);
  const presetName = `E2E saved preset ${Date.now()}`;
  const totalDuration = 45 * 60;
  const presetId = await addPreset(
    page,
    {
      name: presetName,
      type: "Total duration",
      focusDuration: 0,
      breakDuration: 0,
      totalDuration,
      breakReminder: 10 * 60,
      numberOfBreaks: 0,
      breakType: "Reminder"
    },
    { idPrefix: "e2e_saved_preset" }
  );

  try {
    await ensureAdvancedFocus(page);
    await selectPresetsMode(page);
    const savedPreset = page
      .locator("button.userdata")
      .filter({ hasText: presetName });
    await expect(savedPreset).toBeVisible({ timeout: 15_000 });
    await savedPreset.click({ timeout: 5_000 });

    await expect(savedPreset).toHaveClass(/bg-aps1/, { timeout: 10_000 });
    const previewBar = page
      .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
      .first();
    await expect(previewBar).toBeVisible({ timeout: 15_000 });
    await expect(previewBar).toHaveAttribute("data-session-type", "COUNTDOWN");
    await expect
      .poll(() => readIntervalBars(page), {
        message:
          'saved preset appears in presets and starts with its composition: toEqual [{ type: "focus", duration: totalDuration }]',
        timeout: 15_000
      })
      .toEqual([{ type: "focus", duration: totalDuration }]);
    await expect(page.getByText("Now", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
    await expect(
      page
        .getByRole("button")
        .filter({ hasText: /\d{1,2}:\d{2}/ })
        .first()
    ).toBeVisible();
    await expect(
      page.getByRole("button").filter({ hasText: "♾️" })
    ).toHaveCount(0);
    await expect(page.getByText("Total:").first()).toContainText("45 m");
    await expect(page.getByText("Focus:").first()).toContainText("45 m");
    await expect(page.getByText(/Break:\s*NA/)).toBeVisible();

    await startAdvancedFocus(page);
    await waitForSessionElapsed(page, 2);

    const activeSessionState = await readSessionRuntime(page);
    expect(activeSessionState).toMatchObject({
      composition: {
        breakType: "Reminder",
        name: presetName,
        totalDuration,
        type: "Total duration"
      },
      isSessionRunning: true,
      plannedDuration: totalDuration,
      state: 1,
      type: "COUNTDOWN"
    });
    expectPlannedEndNearStart(activeSessionState);
    expect(Math.floor(activeSessionState.totalElapsed)).toBeGreaterThanOrEqual(
      2
    );
    expect(Math.floor(activeSessionState.timeElapsed)).toBeGreaterThanOrEqual(
      1
    );
    expect(activeSessionState.focusElapsed).toBeGreaterThanOrEqual(1);
    expect(activeSessionState.breakElapsed).toBe(0);
    expect(activeSessionState.totalIdle).toBe(0);
    expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
      expect.objectContaining({
        type: 1,
        duration: totalDuration,
        progress: expect.any(Number)
      })
    ]);
    expect(activeSessionState.intervals[0].progress).toBeGreaterThan(0);
    expect(activeSessionState.intervals[0].progress).toBeLessThan(0.05);

    const runningBars = await readRunningIntervalBars(page);
    expect(runningBars.sessionType).toBe("COUNTDOWN");
    expect(runningBars.intervals).toEqual([
      expect.objectContaining({
        type: "focus",
        duration: totalDuration,
        progress: expect.any(Number)
      })
    ]);
    expect(runningBars.intervals[0].progress).toBeGreaterThan(0);

    await expect(
      page.getByText("Start", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("End", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/CURRENT FOCUS/i).first()).toBeVisible();
    await expectRunningSessionTotals(page);
    await reloadAndExpectRunningComposition(page, activeSessionState);
    expect(pageErrors).toEqual([]);
  } finally {
    await removeSavedPreset(page, presetId).catch(() => null);
  }
});

test("switching from a selected preset to custom composition replaces the session plan", async ({
  page
}) => {
  test.setTimeout(120_000);
  const pageErrors = collectPageErrors(page);
  const presetName = `E2E switch preset ${Date.now()}`;
  const focusDuration = 12 * 60;
  const breakDuration = 1 * 60;
  const presetId = await addPreset(
    page,
    {
      name: presetName,
      type: "Pomodoro",
      numberOfFocusRounds: 2,
      focusDuration,
      breakDuration,
      totalDuration: 0,
      breakReminder: 10 * 60,
      numberOfBreaks: 1,
      breakType: "Predefined"
    },
    { idPrefix: "e2e_saved_preset" }
  );

  try {
    await ensureAdvancedFocus(page);
    await selectPresetsMode(page);
    const preset = page
      .locator("button.userdata")
      .filter({ hasText: presetName });
    await expect(preset).toBeVisible({ timeout: 15_000 });
    await preset.click({ timeout: 5_000 });
    await expect(preset).toHaveClass(/bg-aps1/, { timeout: 10_000 });
    await expect
      .poll(() => readIntervalBars(page), {
        message:
          'switching from a selected preset to custom composition replac...: toEqual [ { type: "focus", duration: focusDuration }, { type: "break", duration: breakDuration }, { ',
        timeout: 15_000
      })
      .toEqual([
        { type: "focus", duration: focusDuration },
        { type: "break", duration: breakDuration },
        { type: "focus", duration: focusDuration }
      ]);
    await expect(page.getByText("Total:").first()).toContainText("25 m");

    await selectCustomMode(page);
    await selectDurationTab(page, "Countup");

    const previewBar = page
      .locator('[data-testid="interval-bar"][data-composition-preview="true"]')
      .first();
    await expect(previewBar).toHaveAttribute("data-session-type", "COUNTUP");
    await expect(page.getByText("Total:").first()).toContainText("∞");
    await expect(page.getByText("Focus:").first()).toContainText("∞");
    await expect(
      page.getByRole("button").filter({ hasText: "♾️" }).first()
    ).toBeVisible();

    await startAdvancedFocus(page);
    await waitForSessionElapsed(page, 2);

    const activeSessionState = await readSessionRuntime(page);
    expect(activeSessionState).toMatchObject({
      composition: {
        type: "Countup"
      },
      isSessionRunning: true,
      plannedDuration: 0,
      state: 1,
      type: "COUNTUP"
    });
    expect(activeSessionState.totalElapsed).toBeGreaterThanOrEqual(1);
    expect(projectRuntimeIntervals(activeSessionState.intervals)).toEqual([
      expect.objectContaining({
        type: 1,
        progress: 1,
        duration: expect.any(Number)
      })
    ]);
    await expect(
      page.getByText("Start", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("Now", { exact: true }).first()).toBeVisible();
    await expectRunningSessionTotals(page);
    await reloadAndExpectRunningComposition(page, activeSessionState);
    expect(pageErrors).toEqual([]);
  } finally {
    await removeSavedPreset(page, presetId).catch(() => null);
  }
});
