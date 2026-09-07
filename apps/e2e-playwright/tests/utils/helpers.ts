import { expect, test, type Page } from "@playwright/test";
import {
  getAppMenuNavLabels,
  getProductNavConfig
} from "@nucleum/products/product-nav.config";
import { Product } from "@nucleum/products/product.type";
import { requireE2EProduct, type SurfaceKey } from "../../config/e2e.config";
import {
  isE2ECloudAuthMode,
  isE2ECloudOnlyAuthMode,
  isE2EOfflineAuthMode,
  resolveE2EAuthMode,
  type E2EAuthMode
} from "../../config/auth-mode";
import {
  expectSurfaceVisible,
  navigateToSurface as navigateToSurfaceContract
} from "./surface-contracts";
import { expectAnyLocatorVisible } from "./locator-assertions";
import {
  getResourceContextMenuTrigger,
  getResourceRecordsContainer,
  getResourceThumbnails,
  requireResourceBrowseContract,
  type ResourceKey
} from "./resource-matrix";

/**
 * Assert every configured app menu nav label is visible as a button.
 */
export async function assertAppMenuVisible(
  page: Page,
  product: Product,
  options?: { timeout?: number }
) {
  const timeout = options?.timeout ?? 10_000;
  for (const label of getAppMenuNavLabels(product)) {
    await expect(
      page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).first()
    ).toBeVisible({ timeout });
  }
}

const runtimeEnv = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env;

/**
 * Resolve the active E2E authentication mode for test helpers.
 */
export function getE2EAuthMode() {
  return resolveE2EAuthMode(runtimeEnv);
}

/**
 * Return true when the current run should exercise AuthFn cloud login state.
 */
export function isCloudAuthModeActive() {
  return isE2ECloudAuthMode(getE2EAuthMode());
}

export async function navigateToSurface(
  page: Page,
  surface: SurfaceKey,
  projectName: string = test.info().project.name
) {
  await navigateToSurfaceContract(
    page,
    requireE2EProduct(projectName),
    surface
  );
}

export async function expectCurrentSurfaceVisible(
  page: Page,
  surface: SurfaceKey,
  projectName: string = test.info().project.name
) {
  await expectSurfaceVisible(page, requireE2EProduct(projectName), surface);
}

async function installAuthModeInit(page: Page, authMode: E2EAuthMode) {
  await page.addInitScript((mode) => {
    const ensureOfflineSessionId = () => {
      if (window.localStorage.getItem("offlineSessionId")) return;
      const fallback = () => {
        const bytes = new Uint32Array(4);
        globalThis.crypto?.getRandomValues(bytes);
        return Array.from(bytes, (value) => value.toString(16)).join("-");
      };
      const value = globalThis.crypto?.randomUUID?.() ?? fallback();
      window.localStorage.setItem("offlineSessionId", value);
    };
    if (mode === "offline") {
      ensureOfflineSessionId();
      window.localStorage.removeItem("datafnOfflinability");
    }
    if (mode === "cloud-only") {
      window.localStorage.removeItem("offlineSessionId");
      window.localStorage.setItem("datafnOfflinability", "false");
    }
  }, authMode);
}

async function ensureOfflineSessionId(page: Page) {
  await page.evaluate(() => {
    if (window.localStorage.getItem("offlineSessionId")) return;
    const fallback = () => {
      const bytes = new Uint32Array(4);
      globalThis.crypto?.getRandomValues(bytes);
      return Array.from(bytes, (value) => value.toString(16)).join("-");
    };
    const value = globalThis.crypto?.randomUUID?.() ?? fallback();
    window.localStorage.setItem("offlineSessionId", value);
  });
}

export async function ensureInAppOnHome(page: Page) {
  const authMode = getE2EAuthMode();
  await installAuthModeInit(page, authMode);
  const safeGoto = async (url: string) => {
    await expect(async () => {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
      } catch (err) {
        const message = (err as Error).message || "";
        if (!/ERR_CONNECTION_REFUSED/i.test(message)) throw err;
        throw new Error(`App server refused navigation to ${url}`);
      }
    }).toPass({ intervals: [250, 500, 1_000], timeout: 30_000 });
  };

  await safeGoto("/");
  await page.waitForLoadState("domcontentloaded");
  const product = requireE2EProduct(test.info().project.name);
  const home = `/${getProductNavConfig(product).homePath}`;
  const authStateCommand =
    product === Product.NUCLEUM
      ? "npm run e2e:save-email-auth:nucleum"
      : `PRODUCT=${product.toUpperCase()} APP_BASE_URL=${page.url()} npm run e2e:save-email-auth`;
  const isAuthShellVisible = async () => {
    const pathname = new URL(page.url()).pathname;
    const loginSignupVisible = await page
      .getByRole("button", { name: /Login\/Signup/i })
      .first()
      .isVisible()
      .catch(() => false);
    const continueOfflineVisible = await page
      .getByRole("button", { name: /Continue (using )?offline/i })
      .first()
      .isVisible()
      .catch(() => false);
    return (
      pathname === "/signup" ||
      pathname === "/account/login" ||
      loginSignupVisible ||
      continueOfflineVisible
    );
  };
  const assertNotAuthShell = async () => {
    const pathname = new URL(page.url()).pathname;
    if (await isAuthShellVisible()) {
      throw new Error(
        [
          `Authenticated app test is on auth shell at ${page.url()}.`,
          "Playwright storageState is missing, stale, or not accepted by AuthFn.",
          `Regenerate it from apps/e2e-playwright with: ${authStateCommand}`,
          "Required env: E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD."
        ].join(" ")
      );
    }
    if (pathname !== "/") return;

    const bodyText = await page
      .locator("body")
      .innerText({ timeout: 3_000 })
      .catch(() => "");
    const bodySummary = bodyText.replace(/\s+/g, " ").trim().slice(0, 240);
    if (/Something went wrong|Shoot!|Yikes!|Uh-oh!|Oh no!/i.test(bodyText)) {
      const message = [
        `Authenticated app test reached the app error page at ${page.url()}.`,
        "This is not a confirmed auth-shell failure; inspect console and network artifacts."
      ];
      if (bodySummary) message.push(`Page text: ${bodySummary}`);
      throw new Error(message.join(" "));
    }
  };
  const assertCloudOnlyState = async () => {
    if (!isE2ECloudOnlyAuthMode(authMode)) return;
    const state = await page.evaluate(() => ({
      datafnOfflinability: window.localStorage.getItem("datafnOfflinability"),
      offlineSessionId: window.localStorage.getItem("offlineSessionId")
    }));
    if (state.offlineSessionId) {
      throw new Error(
        "Cloud-only E2E mode must not carry an offlineSessionId in local storage."
      );
    }
    if (state.datafnOfflinability !== "false") {
      throw new Error(
        "Cloud-only E2E mode expected datafnOfflinability=false before app boot."
      );
    }
  };
  const goHomeWithOfflineSession = async () => {
    await ensureOfflineSessionId(page);
    await safeGoto(home);
    await page.waitForLoadState("domcontentloaded").catch(() => null);
  };

  if (isE2EOfflineAuthMode(authMode)) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const currentPath = new URL(page.url()).pathname;
      const onHome = currentPath === home || currentPath.startsWith(`${home}/`);
      if (onHome && !(await isAuthShellVisible())) break;
      await goHomeWithOfflineSession();
    }
  } else {
    await page
      .waitForURL(
        (u) => {
          const p = new URL(u).pathname;
          return p !== "/" && p !== "/signup" && p !== "/account/login";
        },
        { timeout: 15_000, waitUntil: "domcontentloaded" }
      )
      .catch(() => null);
    await assertNotAuthShell();
    await assertCloudOnlyState();
  }

  const currentPath = new URL(page.url()).pathname;
  const onHome = currentPath === home || currentPath.startsWith(`${home}/`);
  if (!onHome) {
    if (isE2EOfflineAuthMode(authMode)) {
      await goHomeWithOfflineSession();
    } else {
      await page.goto(home, {
        waitUntil: "domcontentloaded"
      });
    }
    await page.waitForURL(
      (u) => {
        const p = new URL(u).pathname;
        return p === home || p.startsWith(`${home}/`);
      },
      { timeout: 15_000, waitUntil: "domcontentloaded" }
    );
  }
  if (isE2ECloudAuthMode(authMode)) {
    await assertNotAuthShell();
    await assertCloudOnlyState();
  }
  const navMarkers = [
    ...getAppMenuNavLabels(product).map((label) =>
      page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).first()
    ),
    page.getByRole("button", { name: "Today" }).first(),
    page.getByRole("button", { name: /command bar/i }).first(),
    page.getByTestId("topnav-account-settings").first(),
    page.getByTestId("leftnav-settings").first()
  ];
  await expectAnyLocatorVisible(navMarkers, {
    message: `${product} home exposes a visible navigation anchor`,
    timeout: 45_000
  });
}

/**
 * Open command bar, type the command label, press Enter.
 */
export async function runCommand(page: Page, commandLabel: string) {
  const cmdButton = page.getByRole("button", { name: /command bar/i });
  await cmdButton.click({ timeout: 5_000 });
  const cmdInput = page.getByTestId("command-bar-input");
  await cmdInput.waitFor({ state: "visible", timeout: 15_000 });
  await cmdInput.fill(commandLabel);
  await page.keyboard.press("Enter");
}

function normalizeNotificationContent(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Read the latest visible app-wide toast notification content.
 */
export async function readToastNotificationContent(
  page: Page,
  options?: { expectedContent?: string | RegExp; timeout?: number }
) {
  const toast = page.getByTestId("toast-notification-content").last();
  const timeout = options?.timeout ?? 5_000;
  if (options?.expectedContent) {
    await expect(toast).toContainText(options.expectedContent, { timeout });
  } else {
    await toast.waitFor({ state: "visible", timeout });
  }
  return normalizeNotificationContent(await toast.innerText());
}

/** Library tab label for bulk editor tests (matches button name with optional count). */
export const LibraryTab = {
  Nodes: /^Nodes(\s+\d+)?$/i,
  Collections: /^Collections(\s+\d+)?$/i,
  Objectives: /^Objectives(\s+\d+)?$/i,
  Tasks: /^Tasks(\s+\d+)?$/i
} as const;

/**
 * Open Library and switch to the given tab (Nodes, Collections, Objectives, or Tasks).
 * Assumes we're already in the app (e.g. after ensureInAppOnHome).
 */
export async function openLibraryAndTab(
  page: Page,
  tabName: RegExp
): Promise<void> {
  const tabButton = page.getByRole("button", { name: tabName }).first();
  if (await tabButton.isVisible().catch(() => false)) {
    await tabButton.click({ timeout: 5_000 });
    return;
  }

  const leftNavLibraryButton = page
    .getByTestId("leftnav-sidebar-toggle")
    .getByRole("button", { name: /^Library$/i })
    .first();
  const visibleLeftNavLibraryButton = await leftNavLibraryButton
    .isVisible()
    .catch(() => false);
  const libraryButton = visibleLeftNavLibraryButton
    ? leftNavLibraryButton
    : page.getByRole("button", { name: /^Library$/i }).first();
  await libraryButton.click({ timeout: 5_000 });
  await page.waitForURL((u) => /^\/library(\/.*)?$/.test(new URL(u).pathname), {
    timeout: 10_000,
    waitUntil: "domcontentloaded"
  });
  const tabVisible = await tabButton
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (!tabVisible && tabName === LibraryTab.Collections) {
    const collectionSearchInput = page.getByRole("textbox", {
      name: /Search collections/i
    });
    const collectionBrowseVisible = await collectionSearchInput
      .waitFor({ state: "visible", timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (collectionBrowseVisible) {
      return;
    }
  }
  await tabButton.waitFor({ state: "visible", timeout: 10_000 });
  await tabButton.click({ timeout: 5_000 });
}

/**
 * Perform drag selection so that at least the first two thumbnails in the container
 * are selected. Uses the same logic as the app: mousedown in empty space, drag to
 * cover elements with id^='thumbnail-', mouseup.
 * @param page - Playwright page
 * @param resource - resource browser whose first thumbnails should be selected
 */
export async function dragSelectFirstTwoThumbnails(
  page: Page,
  resource: ResourceKey
): Promise<void> {
  const contract = requireResourceBrowseContract(
    test.info().project.name,
    resource
  );
  const container = getResourceRecordsContainer(page, contract);
  await container.waitFor({ state: "visible", timeout: 15_000 });
  const thumbnails = getResourceThumbnails(page);
  await expect(thumbnails.first()).toBeVisible({ timeout: 20_000 });
  const count = await thumbnails.count();
  if (count < 2) {
    throw new Error(
      `Bulk editor test needs at least 2 ${resource} thumbnails, found ${count}`
    );
  }
  await thumbnails.nth(0).scrollIntoViewIfNeeded();
  await thumbnails.nth(1).scrollIntoViewIfNeeded();
  const containerBox = await container.boundingBox();
  const box1 = await thumbnails.nth(0).boundingBox();
  const box2 = await thumbnails.nth(1).boundingBox();
  if (!containerBox || !box1 || !box2) {
    throw new Error("Could not get bounding boxes for container or thumbnails");
  }
  const minX = Math.min(box1.x, box2.x);
  const minY = Math.min(box1.y, box2.y);
  const maxRight = Math.max(box1.x + box1.width, box2.x + box2.width);
  const maxBottom = Math.max(box1.y + box1.height, box2.y + box2.height);
  const startX = minX - 20;
  const startY = minY - 10;
  if (startX < containerBox.x + 1 || startY < containerBox.y + 1) {
    throw new Error(
      `No empty gutter before the first ${resource} thumbnails; cannot start marquee selection outside a card`
    );
  }
  const endX = maxRight + 20;
  const endY = maxBottom + 15;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 20 });
  await page.mouse.up();
}

/**
 * Select the first two items via the 3-dots context menu - "Select" on each,
 * so the bulk edit bar (down bar with Star, Archive, Delete, etc.) appears.
 * @param page - Playwright page
 * @param resource - resource browser whose first thumbnails should be selected
 */
export async function selectFirstTwoViaContextMenu(
  page: Page,
  resource: ResourceKey
): Promise<void> {
  const contract = requireResourceBrowseContract(
    test.info().project.name,
    resource
  );
  const container = getResourceRecordsContainer(page, contract);
  await container.waitFor({ state: "visible", timeout: 15_000 });
  const thumbnails = getResourceThumbnails(page);
  await expect(thumbnails.first()).toBeVisible({ timeout: 20_000 });
  const count = await thumbnails.count();
  if (count < 2) {
    throw new Error(
      `Bulk editor test needs at least 2 ${resource} thumbnails, found ${count}`
    );
  }
  for (const index of [0, 1]) {
    const thumb = thumbnails.nth(index);
    await thumb.scrollIntoViewIfNeeded();
    await thumb.hover();
    await getResourceContextMenuTrigger(thumb).click({
      timeout: 5_000
    });
    await page
      .getByRole("button", { name: /^Select$/i })
      .click({ timeout: 5_000 });
  }
}

/**
 * Locator for the bulk edit bar (top nav bar showing "Selected: N ..." and action buttons).
 * Use this to scope button clicks so we hit the bar's Star/Archive/Delete/etc., not similar
 * buttons on cards elsewhere on the page.
 */
export function getBulkEditBar(page: Page) {
  return page.getByTestId("bulk-edit-bar");
}
