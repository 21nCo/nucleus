import { expect, type Page } from "@playwright/test";
import { Product } from "@nucleum/client/config/product.type";
import { expectAnyLocatorVisible } from "./locator-assertions";
import { openSettings } from "./settings";

export type SettingsPanelKey =
  | "focus"
  | "node"
  | "mode"
  | "keyboardShortcuts"
  | "accessibility";

export interface SettingsPanelContract {
  key: SettingsPanelKey;
  enabled: boolean;
  sidebarName: RegExp;
  titlePattern: RegExp;
  anchorPatterns: readonly RegExp[];
}

export interface NodeContentPanelContract {
  enabled: boolean;
  contentNavigation: "namedContentTab" | "firstTab";
  bookmarksNavigation: "overviewTabThenInfoCard";
}

function buildSettingsPanelContracts(
  projectName: string
): Record<SettingsPanelKey, SettingsPanelContract> {
  const focusProject = isFocusProject(projectName);
  const memoryProject = isMemoryProject(projectName);

  return {
    focus: {
      key: "focus",
      enabled: focusProject,
      sidebarName: /^Focus$/i,
      titlePattern: /^Focus$/i,
      anchorPatterns: [
        /^Manual logs - Quick durations$/i,
        /^Default break reminder$/i
      ]
    },
    node: {
      key: "node",
      enabled: memoryProject,
      sidebarName: /^Node settings$/i,
      titlePattern: /^Node settings$/i,
      anchorPatterns: [/Don't show text highlight colors/i]
    },
    mode: {
      key: "mode",
      enabled: memoryProject,
      sidebarName: /^Mode of interaction$/i,
      titlePattern: /^Mode of interaction$/i,
      anchorPatterns: [
        /^Preferred mode of interaction$/i,
        /^Hide all hot key and shortcut hints$/i
      ]
    },
    keyboardShortcuts: {
      key: "keyboardShortcuts",
      enabled: memoryProject,
      sidebarName: /^Keyboard shortcuts$/i,
      titlePattern: /^Keyboard shortcuts$/i,
      anchorPatterns: [/^Command bar$/i, /^Edit mode$/i]
    },
    accessibility: {
      key: "accessibility",
      enabled: memoryProject,
      sidebarName: /^Accessibility$/i,
      titlePattern: /^Accessibility$/i,
      anchorPatterns: [/^Block sizing$/i]
    }
  };
}

function isFocusProject(projectName: string) {
  return projectName === Product.NUCLEUM || projectName === Product.POINTRON;
}

function isMemoryProject(projectName: string) {
  return projectName === Product.NUCLEUM || projectName === Product.MEMOTRON;
}

export function getSettingsPanelContract(
  projectName: string,
  key: SettingsPanelKey
) {
  return buildSettingsPanelContracts(projectName)[key];
}

export function listEnabledSettingsPanels(projectName: string) {
  return Object.values(buildSettingsPanelContracts(projectName)).filter(
    (contract) => contract.enabled
  );
}

export function getNodeContentPanelContract(
  projectName: string
): NodeContentPanelContract {
  return {
    enabled: isMemoryProject(projectName),
    contentNavigation: "firstTab",
    bookmarksNavigation: "overviewTabThenInfoCard"
  };
}

export async function openDeclaredSettingsPanel(
  page: Page,
  projectName: string,
  key: SettingsPanelKey
) {
  const contract = getSettingsPanelContract(projectName, key);
  if (!contract.enabled) {
    throw new Error(
      `E2E_CFG_002: settings panel "${key}" is disabled for ${projectName}`
    );
  }

  await openSettings(page);
  const sidebar = page.getByTestId("settings-sidebar");
  await expect(sidebar).toBeVisible({ timeout: 10_000 });

  await sidebar
    .getByRole("button", { name: contract.sidebarName })
    .click({ timeout: 5_000 });

  const title = page.getByText(contract.titlePattern).first();
  const anchors = contract.anchorPatterns.map((pattern) =>
    page.getByText(pattern).first()
  );

  await expectAnyLocatorVisible([title, ...anchors], {
    message: `${key} settings exposes its title or a semantic anchor`,
    timeout: 10_000
  });

  return contract;
}

export async function openDeclaredNodeContentPanel(
  page: Page,
  projectName: string
) {
  const contract = getNodeContentPanelContract(projectName);
  if (!contract.enabled) {
    throw new Error(
      `E2E_CFG_002: node content panel contract is disabled for ${projectName}`
    );
  }

  const tablist = page.getByRole("tablist").first();
  await expect(tablist).toBeVisible({ timeout: 10_000 });

  if (contract.contentNavigation === "firstTab") {
    const firstTab = tablist.getByRole("tab").first();
    await expect(firstTab).toBeVisible({ timeout: 5_000 });
    await firstTab.click({ timeout: 5_000 });
    await expect(firstTab).toHaveAttribute("aria-selected", "true", {
      timeout: 5_000
    });
    return contract;
  }

  const contentTab = tablist.getByRole("tab", { name: /^Content$/i }).first();
  await expect(contentTab).toBeVisible({ timeout: 5_000 });
  await contentTab.click({ timeout: 5_000 });
  await expect(contentTab).toHaveAttribute("aria-selected", "true", {
    timeout: 5_000
  });
  return contract;
}

export async function openDeclaredNodeBookmarksPanel(
  page: Page,
  projectName: string
) {
  const contract = getNodeContentPanelContract(projectName);
  if (!contract.enabled) {
    throw new Error(
      `E2E_CFG_002: node content panel contract is disabled for ${projectName}`
    );
  }

  const tablist = page.getByRole("tablist").first();
  await expect(tablist).toBeVisible({ timeout: 10_000 });

  if (contract.bookmarksNavigation === "overviewTabThenInfoCard") {
    const overviewTab = tablist.getByRole("tab").nth(1);
    await expect(overviewTab).toBeVisible({ timeout: 5_000 });
    await overviewTab.click({ timeout: 5_000 });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true", {
      timeout: 5_000
    });

    const bookmarksCard = page.getByText(/^Bookmarks$/i).first();
    await expect(bookmarksCard).toBeVisible({ timeout: 10_000 });
    await bookmarksCard.click({ timeout: 5_000 });
    await expect(page.getByPlaceholder("Search bookmarks")).toBeVisible({
      timeout: 10_000
    });
  }

  return contract;
}
