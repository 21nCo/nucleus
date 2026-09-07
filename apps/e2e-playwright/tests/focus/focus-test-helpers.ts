import { expect, type Locator, type Page } from "@playwright/test";
import { Action } from "@nucleum/application/commandBar/action.enum";
import {
  ensureInAppOnHome,
  LibraryTab,
  openLibraryAndTab,
  runCommand
} from "../utils/helpers";
import { expectAnyLocatorVisible } from "../utils/locator-assertions";
import { resolveRepoFsImportPath } from "../utils/repo-fs";

const sessionStorePath = resolveRepoFsImportPath(
  "client/features/focus/session.store.ts"
);
const pointronStorePath = resolveRepoFsImportPath(
  "client/features/focus/preferences.store.ts"
);
const modalStorePath = resolveRepoFsImportPath(
  "client/application/modal/modal.store.ts"
);

export interface CreateFocusResourceOptions {
  label?: string;
  prefix?: string;
}

function resolveLabel(
  options: CreateFocusResourceOptions,
  fallbackPrefix: string
) {
  return options.label ?? `${options.prefix ?? fallbackPrefix} ${Date.now()}`;
}

function getAdvancedFocusControls(page: Page) {
  return {
    customButton: page.getByRole("button", { name: /^Custom$/i }).first(),
    presetsButton: page.getByRole("button", { name: /^Presets$/i }).first()
  };
}

async function isLocatorVisible(locator: Locator) {
  return locator.isVisible().catch(() => false);
}

/**
 * Collect page-level runtime errors for assertions in focus specs.
 */
export function collectPageErrors(
  page: Page,
  options: { includeStack?: boolean } = {}
) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(
      options.includeStack ? (error.stack ?? String(error)) : error.message
    );
  });
  return pageErrors;
}

/** Prevents external Google account navigation during Focus workflows. */
export async function blockGoogleAccountsNavigation(page: Page) {
  await page.route("**/*", (route) => {
    if (/accounts\.google\.com/i.test(route.request().url())) {
      return route.abort();
    }
    return route.continue();
  });
}

/**
 * Reset the active focus session and composition through the product store.
 */
export async function resetFocusSession(page: Page) {
  await page.evaluate(
    async ({ modulePaths }) => {
      const sessionMod = await import(modulePaths.sessionStorePath);
      await sessionMod.activeSession.close();
      await sessionMod.activeSession.resetComposition();
    },
    {
      modulePaths: {
        sessionStorePath
      }
    }
  );
}

/**
 * Returns the serializable active-session and focus-item state.
 */
export async function readSessionRuntime(page: Page) {
  return page.evaluate(
    async ({ modulePath }) => {
      const sessionMod = await import(modulePath);
      const active = sessionMod.activeSession.get();
      const focusItems = sessionMod.focusItemsStore.get();
      const intervals = active.intervals ?? [];
      const progressedIntervals = intervals.filter(
        (interval: any) => interval && interval.progress > 0
      );
      const focusElapsed = progressedIntervals
        .filter((interval: any) => interval.type === 1)
        .reduce(
          (sum: number, interval: any) =>
            sum + Number(interval.duration ?? 0) * Number(interval.progress),
          0
        );
      const breakElapsed = progressedIntervals
        .filter((interval: any) => interval.type === 0)
        .reduce(
          (sum: number, interval: any) =>
            sum + Number(interval.duration ?? 0) * Number(interval.progress),
          0
        );
      let currentFocusItem: { id: string; start: number } | undefined;
      const unsubscribe = sessionMod.currentFocusItem.subscribe(
        (value: any) => {
          currentFocusItem = value
            ? { id: value.id.toString(), start: Number(value.start) }
            : undefined;
        }
      );
      unsubscribe();
      return {
        breakElapsed,
        composition: {
          additional: Array.isArray(active.composition?.additional)
            ? active.composition.additional.map((item: any) => ({
                breakDuration: item.breakDuration,
                focusDuration: item.focusDuration,
                numberOfFocusRounds: item.numberOfFocusRounds,
                type: item.type
              }))
            : active.composition?.additional,
          breakDuration: active.composition?.breakDuration,
          breakReminder: active.composition?.breakReminder,
          breakType: active.composition?.breakType,
          focusDuration: active.composition?.focusDuration,
          name: active.composition?.name,
          numberOfBreaks: active.composition?.numberOfBreaks,
          numberOfFocusRounds: active.composition?.numberOfFocusRounds,
          totalDuration: active.composition?.totalDuration,
          type: active.composition?.type
        },
        currentBlockId: active.currentBlockId,
        currentFocusItem,
        currentSessionId: active.currentSessionId?.toString(),
        end: active.end ? new Date(active.end).getTime() : undefined,
        focusElapsed,
        intervals: intervals.map((interval: any) => ({
          duration: Number(interval.duration ?? 0),
          id: interval.id,
          progress: Number(interval.progress ?? 0),
          start: Number(interval.start ?? 0),
          type: Number(interval.type)
        })),
        isQuickStartOn: active.isQuickStartOn,
        isSessionRunning: active.isSessionRunning,
        items: (focusItems.items ?? []).map((item: any) => ({
          blocks: (item.blocks ?? []).map((block: any) => ({
            end: Number(block.end),
            start: Number(block.start)
          })),
          id: item.id.toString(),
          tasks: (item.tasks ?? []).map((id: any) => id.toString())
        })),
        notes: active.notes,
        plannedDuration: Number(active.plannedDuration ?? 0),
        removedItems: (focusItems.removedItems ?? []).map((item: any) => ({
          blocks: (item.blocks ?? []).map((block: any) => ({
            end: Number(block.end),
            start: Number(block.start)
          })),
          id: item.id.toString(),
          tasks: (item.tasks ?? []).map((id: any) => id.toString())
        })),
        start: active.start ? new Date(active.start).getTime() : undefined,
        state: Number(active.state),
        timeElapsed: Number(active.timeElapsed ?? 0),
        totalElapsed: Number(active.totalElapsed ?? 0),
        totalIdle: Number(active.totalIdle ?? 0),
        type: active.type
      };
    },
    { modulePath: sessionStorePath }
  );
}

/**
 * Waits until the live session reaches a minimum elapsed duration.
 */
export async function waitForSessionElapsed(page: Page, seconds: number) {
  await expect
    .poll(async () => (await readSessionRuntime(page)).totalElapsed, {
      message: "waitForSessionElapsed: toBeGreaterThanOrEqual seconds",
      timeout: 20_000
    })
    .toBeGreaterThanOrEqual(seconds);
}

/**
 * Hides the focus full-screen surface while leaving the session running.
 */
export async function hideFocusFullscreen(page: Page) {
  await page.evaluate(
    async ({ modulePath }) => {
      const modalMod = await import(modulePath);
      modalMod.fullScreen.hide();
      modalMod.player.showMini("FOCUS_PLAYER");
    },
    { modulePath: modalStorePath }
  );
  await expect(
    page.locator('[aria-roledescription="zen mode"]').first()
  ).toBeHidden({ timeout: 15_000 });
}

/** Opens the focus full-screen surface for the restored running session. */
export async function showFocusFullscreen(page: Page) {
  await page.evaluate(
    async ({ modulePath }) => {
      const modalMod = await import(modulePath);
      modalMod.fullScreen.show("FULL_SCREEN_FOCUS");
    },
    { modulePath: modalStorePath }
  );
  await expect(
    page.locator('[aria-roledescription="zen mode"]').first()
  ).toBeVisible({ timeout: 15_000 });
}

/** Reloads the app and waits for the restored active-session UI. */
export async function reloadActiveSession(page: Page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureInAppOnHome(page);
  await expect(
    page.getByRole("button", { name: /^\d{2}:\d{2}(?::\d{2})?$/ }).last()
  ).toBeVisible({ timeout: 15_000 });
}

/**
 * Navigate to Advanced focus unless it is already ready on the current page.
 */
export async function ensureAdvancedFocus(
  page: Page,
  options: { reload?: boolean } = {}
) {
  const { presetsButton, customButton } = getAdvancedFocusControls(page);
  if (
    !options.reload &&
    (await isLocatorVisible(presetsButton)) &&
    (await isLocatorVisible(customButton))
  ) {
    return;
  }

  if (options.reload) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureInAppOnHome(page);
  }
  await openFocusViaTopNav(page);
  if (
    (await presetsButton.isVisible().catch(() => false)) &&
    (await customButton.isVisible().catch(() => false))
  ) {
    return;
  }
  const advancedTab = page.getByText("Advanced", { exact: true }).first();
  await expect(advancedTab).toBeVisible({ timeout: 15_000 });
  await advancedTab.click({ timeout: 5_000 });
  await expect(presetsButton).toBeVisible({ timeout: 15_000 });
  await expect(customButton).toBeVisible({ timeout: 15_000 });
}

/**
 * Select Custom mode in Advanced focus.
 */
export async function selectCustomMode(page: Page) {
  await page.getByText("Custom", { exact: true }).first().click();
}

/**
 * Select Presets mode in Advanced focus.
 */
export async function selectPresetsMode(page: Page) {
  await page.getByText("Presets", { exact: true }).first().click();
}

/**
 * Select a duration composition mode by label from the mode list.
 */
export async function selectDurationTab(page: Page, name: string) {
  const modeKey = name.trim().toLowerCase().replace(/\s+/g, "-");
  const modeButton = page.getByTestId(`composition-mode-${modeKey}`);
  const config = page.getByTestId("composition-mode-config");
  const list = page.getByTestId("composition-mode-list");

  if (await config.isVisible().catch(() => false)) {
    const currentMode = await config.getAttribute("data-composition-mode");
    if (currentMode?.toLowerCase() === name.toLowerCase()) {
      return;
    }
    await page
      .getByTestId("composition-mode-config-header")
      .locator("button")
      .first()
      .click({ timeout: 5_000 });
    await expect(list).toBeVisible({ timeout: 10_000 });
  }

  await expect(list).toBeVisible({ timeout: 15_000 });
  await modeButton.click({ timeout: 5_000 });
  await expect(config).toBeVisible({ timeout: 15_000 });
  await expect(config).toHaveAttribute(
    "data-composition-mode",
    new RegExp(`^${name}$`, "i")
  );
}

/**
 * Fill a duration input exposed by its wrapper test id.
 */
export async function fillDurationInput(
  root: Page | Locator,
  testId: string,
  value: string
) {
  const input = root.getByTestId(testId).locator("input").first();
  await fillInputValue(input, value);
}

/** Replaces an input value and commits it by moving focus away. */
export async function fillInputValue(input: Locator, value: string) {
  await input.click();
  await input.press("ControlOrMeta+A");
  await input.type(value);
  await expect(input).toHaveValue(value, { timeout: 10_000 });
  await input.press("Tab");
}

/**
 * Start Advanced focus and wait for the running-session controls.
 */
export async function startAdvancedFocus(page: Page) {
  await page
    .getByRole("button", { name: /Start focus/i })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: /Finish/i }).first()
  ).toBeVisible({
    timeout: 15_000
  });
}

/**
 * Adds objectives or tasks to Advanced Focus from its search input.
 */
export async function addAdvancedFocusItems(page: Page, labels: string[]) {
  await ensureAdvancedFocus(page);
  if (labels.length === 0) return;
  let focusItemCount = (await readSessionRuntime(page)).items.length;
  const input = page
    .getByPlaceholder("start typing an objective or task name...")
    .first();
  if (!(await input.isVisible().catch(() => false))) {
    await page
      .getByRole("button", {
        name: /\+ add focus items|\d+ focus items? added/i
      })
      .first()
      .dispatchEvent("click");
  }
  await input.waitFor({ state: "visible", timeout: 15_000 });
  const modal = page.getByTestId("modal-SHOW_FOCUSITEMS_MODAL");
  for (const label of labels) {
    await input.fill(label);
    const exactResult = modal.getByText(label, { exact: true }).last();
    await expect(exactResult).toBeVisible({ timeout: 10_000 });
    await exactResult.dispatchEvent("click");
    await expect(input).toHaveValue("", { timeout: 10_000 });
    await expect
      .poll(async () => (await readSessionRuntime(page)).items.length, {
        message: "addAdvancedFocusItems: toBeGreaterThan focusItemCount",
        timeout: 10_000
      })
      .toBeGreaterThan(focusItemCount);
    focusItemCount = (await readSessionRuntime(page)).items.length;
  }
  if (await modal.isVisible().catch(() => false)) {
    const doneButton = modal.getByRole("button", { name: /^Done/i });
    await expect(doneButton).toBeVisible({ timeout: 5_000 });
    await doneButton.click({ force: true, timeout: 5_000 });
    await expect(modal).toBeHidden({ timeout: 10_000 });
  }
}

/**
 * Add a focus preset directly through the Pointron preference store.
 */
export async function addFocusPreset(
  page: Page,
  preset: Record<string, unknown>,
  options: { idPrefix?: string } = {}
) {
  const id = `${options.idPrefix ?? "e2e_preset"}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
  await page.evaluate(
    async ({ modulePaths, preset }) => {
      const pointronStoreMod = await import(modulePaths.pointronStorePath);
      await pointronStoreMod.pointronPreferences.addPreset(preset);
    },
    {
      modulePaths: {
        pointronStorePath
      },
      preset: {
        id,
        ...preset
      }
    }
  );
  return id;
}

/**
 * Remove a focus preset directly through the Pointron preference store.
 */
export async function removeFocusPreset(page: Page, id: string) {
  await page.evaluate(
    async ({ modulePaths, presetId }) => {
      const pointronStoreMod = await import(modulePaths.pointronStorePath);
      await pointronStoreMod.pointronPreferences.removePreset(presetId);
    },
    {
      modulePaths: {
        pointronStorePath
      },
      presetId: id
    }
  );
}

/**
 * Remove focus presets whose names start with the supplied prefix.
 */
export async function removeFocusPresetsByNamePrefix(
  page: Page,
  namePrefix: string
) {
  await page.evaluate(
    async ({ modulePaths, namePrefix }) => {
      const pointronStoreMod = await import(modulePaths.pointronStorePath);
      const presets = pointronStoreMod.pointronPreferences.get().presets;
      for (const preset of presets) {
        if (preset.name?.startsWith(namePrefix)) {
          await pointronStoreMod.pointronPreferences.removePreset(preset.id);
        }
      }
    },
    {
      modulePaths: {
        pointronStorePath
      },
      namePrefix
    }
  );
}

/**
 * Create an objective through the command bar and return the created label.
 * Prefer `seed.focus.objective` unless the test asserts create UI or create-side effects.
 */
export async function createObjectiveViaCommand(
  page: Page,
  options: CreateFocusResourceOptions = {}
) {
  const label = resolveLabel(options, "E2E objective");
  await runCommand(page, "Create a new objective");
  const input = page.getByTestId("objective-name-input");
  await input.waitFor({ state: "visible", timeout: 15_000 });
  await input.fill(label);
  await page.keyboard.press("Enter");
  await expect(input).toBeHidden({ timeout: 10_000 });
  await page.keyboard.press("Escape").catch(() => null);
  await page.keyboard.press("Escape").catch(() => null);
  return label;
}

/**
 * Open the Focus live panel from the global top-nav Focus control.
 */
export async function openFocusViaTopNav(page: Page) {
  const activeFocusLabel = /^(\d{2}:\d{2}|\d{2}:\d{2}:\d{2})$/;
  const panelMarkers = [
    page.getByTestId("quick-focus-search").first(),
    page.getByText("Advanced", { exact: true }).first(),
    page.getByRole("button", { name: /Add manual log/i }).first()
  ];
  const isPanelVisible = async () => {
    for (const marker of panelMarkers) {
      if (await marker.isVisible().catch(() => false)) return true;
    }
    return false;
  };
  if (await isPanelVisible()) return;

  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const inactiveFocusButton = page
      .getByRole("button", {
        name: /^Focus$/i
      })
      .first();
    const activeFocusButton = page
      .getByRole("button", { name: activeFocusLabel })
      .last();
    const isInactiveVisible = await inactiveFocusButton
      .isVisible()
      .catch(() => false);
    const focusButton = isInactiveVisible
      ? inactiveFocusButton
      : activeFocusButton;
    try {
      await focusButton.click({ timeout: 10_000 });
      await expectAnyLocatorVisible(panelMarkers, {
        message: "focus top-nav action opens the live focus panel",
        timeout: 7_500
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/**
 * Open Quick Focus through the global top-nav Focus control.
 */
export async function openQuickFocusPanelViaTopNav(page: Page) {
  const quickFocusPanel = page.getByTestId("quick-focus-panel").first();
  const quickFocusSearch = page.getByTestId("quick-focus-search").first();
  if (await quickFocusSearch.isVisible().catch(() => false)) {
    return { quickFocusPanel, quickFocusSearch };
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await openFocusViaTopNav(page);
    try {
      await quickFocusSearch.waitFor({ state: "visible", timeout: 7_500 });
      return { quickFocusPanel, quickFocusSearch };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Close the Quick Focus panel through the global Focus control. */
export async function closeQuickFocusPanel(page: Page) {
  const inactiveFocusButton = page
    .getByRole("button", { name: /^Focus$/i })
    .filter({ visible: true })
    .first();
  const activeFocusButton = page
    .getByRole("button", { name: /^(\d{2}:\d{2}|\d{2}:\d{2}:\d{2})$/ })
    .filter({ visible: true })
    .first();
  const closeButton = (await inactiveFocusButton.isVisible().catch(() => false))
    ? inactiveFocusButton
    : activeFocusButton;
  await closeButton.click({ timeout: 10_000 });
  await expect(page.getByTestId("quick-focus-search").first()).toBeHidden({
    timeout: 10_000
  });
}

/**
 * Locate a pinned objective card inside the Quick Focus panel.
 */
export function getPinnedGoal(scope: Locator, objectiveName: string) {
  return scope
    .locator("button")
    .filter({ hasText: objectiveName })
    .filter({ hasText: /Not focused today|Today:/i })
    .first();
}

/**
 * Assert a pinned objective is visible in Quick Focus after the search field clears.
 */
export async function expectPinnedGoalVisible(
  quickFocusPanel: Locator,
  quickFocusSearch: Locator,
  objectiveName: string
) {
  const pinnedGoal = getPinnedGoal(quickFocusPanel, objectiveName);
  await expect(quickFocusSearch).toHaveValue("", { timeout: 10_000 });
  await expect(pinnedGoal).toBeVisible({
    timeout: 15_000
  });
  return pinnedGoal;
}

/**
 * Open the Library Objectives tab for focus-domain tests.
 */
export async function openObjectiveLibrary(page: Page) {
  await openLibraryAndTab(page, LibraryTab.Objectives);
}

/**
 * Open the Library Tasks tab for focus-domain tests.
 */
export async function openTaskLibrary(page: Page) {
  await openLibraryAndTab(page, LibraryTab.Tasks);
}

/**
 * Navigate to the calendar timeline and assert a completed focus session is visible.
 */
export async function assertFocusSessionInTimeline(
  page: Page,
  objectiveName: string
) {
  const calendarPath = `/${Action.CALENDAR}`;
  await page
    .getByText("Calendar", { exact: true })
    .first()
    .click({ timeout: 5_000 });
  await page.waitForURL(
    (u) => new RegExp(`^${calendarPath}(\\/.*)?$`).test(new URL(u).pathname),
    { timeout: 10_000 }
  );
  await page
    .getByRole("button", { name: /^Today$/i })
    .first()
    .click({ timeout: 5_000 })
    .catch(() => null);

  await page
    .getByRole("button", { name: /^Close$/i })
    .first()
    .click({ timeout: 3_000 })
    .catch(() => null);

  const timelineFocusEntry = page
    .locator("button")
    .filter({
      hasText: /\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M/
    })
    .first();
  await expect(timelineFocusEntry).toBeVisible({ timeout: 15_000 });

  await expect(
    page.getByText(objectiveName, { exact: true }).first()
  ).toBeVisible({ timeout: 10_000 });
}
