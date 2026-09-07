import { Product } from "@21n/types/product.type";
import { expect, type Locator, type Page } from "@playwright/test";
import type { E2EProduct, SurfaceKey } from "../../config/e2e.config";
import {
  requireE2EProduct,
  resolveSurfaceContract
} from "../../config/e2e.config";
import { E2EContractError } from "./contract-error";
import { navigateToSurface } from "./surface-contracts";

export type ResourceKey = "collection" | "objective" | "task" | "node";

export interface ResourceContract {
  browseSurface: SurfaceKey;
  searchTextboxName: RegExp;
  searchToggleName: RegExp | null;
  openActionId: string | null;
  renameEnabled: boolean;
  recordsTestId: string;
  libraryActionIds: readonly string[];
  recordActionIds: readonly string[];
  recordControlNames: readonly RegExp[];
}

const resourceInteraction = {
  defaultRecordsTestId: "resource-records-container",
  thumbnailTestIdPrefix: "resource-thumbnail:",
  contextMenuTriggerTestId: "thumbnail-context-menu-trigger",
  recordContextMenuTestId: "resource-record-context-menu",
  recordSurfaceTestId: "resource-record-surface",
  queryParams: {
    archived: "archived",
    starred: "starred"
  }
} as const;

function createBaseContract(
  projectName: E2EProduct,
  key: ResourceKey
): ResourceContract {
  switch (key) {
    case "collection":
      return {
        browseSurface: "library.collections",
        searchTextboxName: /Search collections/i,
        searchToggleName: null,
        openActionId: null,
        renameEnabled: projectName === Product.NUCLEUM,
        recordsTestId: resourceInteraction.defaultRecordsTestId,
        libraryActionIds: ["select", "star", "COPY_LINK", "archive", "delete"],
        recordActionIds: ["star", "edit", "COPY_LINK", "archive", "delete"],
        recordControlNames: []
      };
    case "objective":
      return {
        browseSurface: "library.objectives",
        searchTextboxName: /Search objectives/i,
        searchToggleName: null,
        openActionId: null,
        renameEnabled: false,
        recordsTestId: resourceInteraction.defaultRecordsTestId,
        libraryActionIds: [
          "star",
          "edit",
          "COPY_LINK",
          "focusNow",
          "pinToQuickFocus",
          "CONVERT_TO_SUBOBJECTIVE",
          "archive",
          "delete"
        ],
        recordActionIds: ["star", "edit", "COPY_LINK", "archive", "delete"],
        recordControlNames: []
      };
    case "task":
      return {
        recordsTestId: "task-library",
        browseSurface: "library.tasks",
        searchTextboxName: /Search tasks/i,
        searchToggleName: /^Search$/i,
        openActionId: "openTask",
        renameEnabled: false,
        libraryActionIds: [
          "openTask",
          "select",
          "editObjective",
          "toggle",
          "focusNow",
          "delete"
        ],
        recordActionIds: [],
        recordControlNames: [/^Delete$/i, /^Close$/i]
      };
    case "node":
      return {
        browseSurface: "library.nodes",
        searchTextboxName: /Search nodes/i,
        searchToggleName: null,
        openActionId: null,
        renameEnabled: false,
        recordsTestId: resourceInteraction.defaultRecordsTestId,
        libraryActionIds: [
          "select",
          "star",
          "addToCollection",
          "edit",
          "COPY_LINK",
          "archive",
          "delete"
        ],
        recordActionIds: ["star", "COPY_LINK", "archive", "delete"],
        recordControlNames: []
      };
  }
}

export function requireResourceBrowseContract(
  projectName: string,
  resource: ResourceKey
): ResourceContract {
  const product = requireE2EProduct(projectName);
  const contract = createBaseContract(product, resource);
  if (!resolveSurfaceContract(product, contract.browseSurface)) {
    throw new E2EContractError(
      "E2E_CFG_002",
      `Browse contract for resource "${resource}" is not enabled for project "${projectName}".`
    );
  }
  return contract;
}

/** Returns the declared records container for a resource browser. */
export function getResourceRecordsContainer(
  page: Page,
  contract: ResourceContract
) {
  return page.getByTestId(contract.recordsTestId).filter({ visible: true });
}

/** Returns every visible resource thumbnail exposed by the shared resource contract. */
export function getResourceThumbnails(page: Page) {
  return page.getByTestId(
    new RegExp(`^${resourceInteraction.thumbnailTestIdPrefix}`)
  );
}

/** Returns one resource thumbnail by its persisted resource ID. */
export function getResourceThumbnail(page: Page, id: string) {
  return page
    .getByTestId(`${resourceInteraction.thumbnailTestIdPrefix}${id}`)
    .first();
}

/** Returns one resource thumbnail by its rendered label. */
export function getResourceThumbnailByLabel(page: Page, label: string) {
  return getResourceThumbnails(page).filter({ hasText: label }).first();
}

/** Resolves a named thumbnail through the resource's declared search surface. */
export async function findResourceThumbnailByLabel(
  page: Page,
  contract: ResourceContract,
  label: string
) {
  const thumbnail = getResourceThumbnailByLabel(page, label);
  if (await thumbnail.isVisible().catch(() => false)) return thumbnail;

  const search = page.getByRole("textbox", {
    name: contract.searchTextboxName
  });
  if (
    contract.searchToggleName &&
    !(await search.isVisible().catch(() => false))
  ) {
    await page
      .getByRole("button", { name: contract.searchToggleName })
      .click({ timeout: 5_000 });
  }
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill(label);
  await expect(thumbnail).toBeVisible({ timeout: 20_000 });
  return thumbnail;
}

/** Returns a resource thumbnail's declared context-menu trigger. */
export function getResourceContextMenuTrigger(thumbnail: Locator) {
  return thumbnail.getByTestId(resourceInteraction.contextMenuTriggerTestId);
}

/** Returns the shared record overlay for a resource opened from its browser. */
export function getResourceRecordSurface(page: Page) {
  return page
    .getByTestId(resourceInteraction.recordSurfaceTestId)
    .filter({ visible: true });
}

/** Returns the declared context-menu trigger for an open resource record. */
export function getResourceRecordContextMenuTrigger(page: Page) {
  return page
    .getByTestId(resourceInteraction.recordContextMenuTestId)
    .filter({ visible: true })
    .first();
}

/** Opens the product-declared resource browser and waits for its records surface. */
export async function openResourceBrowser(
  page: Page,
  projectName: string,
  resource: ResourceKey
) {
  const product = requireE2EProduct(projectName);
  const contract = requireResourceBrowseContract(product, resource);
  const currentPath = new URL(page.url()).pathname.replace(/\/+$/, "") || "/";
  if (
    currentPath === "/library" &&
    !(await getResourceRecordsContainer(page, contract)
      .isVisible()
      .catch(() => false))
  ) {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  }
  await navigateToSurface(page, product, "library");
  await navigateToSurface(page, product, contract.browseSurface);
  await expect(getResourceRecordsContainer(page, contract)).toBeVisible({
    timeout: 15_000
  });
  return contract;
}

/** Opens a named or identified resource record from its declared browser. */
export async function openResourceRecord(
  page: Page,
  projectName: string,
  resource: ResourceKey,
  target: { id?: string; label?: string }
) {
  const contract = await openResourceBrowser(page, projectName, resource);
  const thumbnail = target.id
    ? getResourceThumbnail(page, target.id)
    : await findResourceThumbnailByLabel(page, contract, target.label!);
  await expect(thumbnail).toBeVisible({ timeout: 20_000 });
  const thumbnailTestId = await thumbnail.getAttribute("data-testid");
  const expectedId =
    target.id ??
    (thumbnailTestId?.startsWith(resourceInteraction.thumbnailTestIdPrefix)
      ? thumbnailTestId.slice(resourceInteraction.thumbnailTestIdPrefix.length)
      : undefined);
  if (contract.openActionId) {
    await thumbnail.hover();
    await getResourceContextMenuTrigger(thumbnail).click({
      timeout: 5_000
    });
    await page
      .locator(`[data-context-menu-item-id="${contract.openActionId}"]`)
      .filter({ visible: true })
      .click({ timeout: 5_000 });
  } else {
    await thumbnail.click({ timeout: 5_000 });
  }
  await expect(getResourceRecordSurface(page)).toBeVisible({
    timeout: 15_000
  });
  if (expectedId) {
    await expect
      .poll(
        () => {
          const url = new URL(page.url());
          return (
            Array.from(url.searchParams.values()).includes(expectedId) ||
            url.pathname.split("/").includes(expectedId)
          );
        },
        { message: "openResourceRecord: toBe true", timeout: 15_000 }
      )
      .toBe(true);
  }
  return { contract, thumbnail };
}

/** Opens a declared resource browser query state without duplicating URL semantics in specs. */
export async function openResourceQueryState(
  page: Page,
  projectName: string,
  resource: ResourceKey,
  state: "active" | "archived" | "starred"
) {
  const contract = await openResourceBrowser(page, projectName, resource);
  const setFilter = async (
    param: string,
    buttonName: RegExp,
    enabled: boolean
  ) => {
    const isEnabled = new URL(page.url()).searchParams.has(param);
    if (isEnabled === enabled) return;
    await page
      .getByRole("button", { name: buttonName })
      .filter({ visible: true })
      .first()
      .click({ timeout: 10_000 });
    await expect
      .poll(() => new URL(page.url()).searchParams.has(param), {
        message: "setFilter: toBe enabled",
        timeout: 10_000
      })
      .toBe(enabled);
  };
  await setFilter(
    resourceInteraction.queryParams.archived,
    /^Show archived items/i,
    state === "archived"
  );
  await setFilter(
    resourceInteraction.queryParams.starred,
    /^Show starred items/i,
    state === "starred"
  );
  await expect(getResourceRecordsContainer(page, contract)).toBeVisible({
    timeout: 15_000
  });
  return contract;
}
