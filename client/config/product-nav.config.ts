/**
 * Single source of truth for product app menu and nav config.
 * Used by both the app (product.config.ts) and E2E tests so menu changes
 * are made in one place only.
 */
import { Product } from "@21n/types/product.type";
import { Action } from "@21n/types/action.enum";
import { PointronAction } from "@21n/types/pointron/pointronAction.enum";

/** Product navigation supplied by the application shell to capability components. */
export const PRODUCT_NAV_CONTEXT = Symbol("product-navigation");

export interface IProductNavConfig {
  /** App menu action IDs for landscape (used by app). */
  appMenu: readonly string[];
  /** App menu for landscape in dev (Nucleum only; optional "home"). */
  appMenuDev?: readonly string[];
  /** App menu action IDs for portrait (used by app). */
  appMenuPt: readonly string[];
  homePath: string;
  homePathPt: string;
  librarySectionLabel: string;
}

const resourceActionId = (resource: string, action: string) =>
  `${resource}_${action}`;

const appMenuActionIds = {
  nodeCreate: resourceActionId("node", "create"),
  spaceBrowse: resourceActionId("combination", "browse")
} as const;

/** Labels used by app menu actions and derived E2E navigation expectations. */
export const appMenuActionLabelsByAction: Record<string, string> = {
  [Action.CALENDAR]: "Calendar",
  [Action.OVERVIEW]: "Overview",
  [Action.LIBRARY]: "Library",
  [Action.LIBRARY_PORTRAIT]: "Library",
  [Action.HOME]: "Home",
  [appMenuActionIds.nodeCreate]: "Capture",
  [appMenuActionIds.spaceBrowse]: "Spaces",
  [PointronAction.FOCUS]: "Focus"
};

const appMenuActionLabelsByProduct = {
  [Product.NUCLEUM]: appMenuActionLabelsByAction,
  [Product.MEMOTRON]: appMenuActionLabelsByAction,
  [Product.POINTRON]: appMenuActionLabelsByAction
} satisfies Partial<Record<Product, Record<string, string>>>;

const resolveAppMenuActionLabel = (
  product: Product,
  action: string
): string => {
  const label = appMenuActionLabelsByProduct[product]?.[action];
  if (!label) {
    throw new Error(
      `Missing app menu action label for action "${action}" in product "${product}"`
    );
  }
  return label;
};

const resolveAppMenuNavLabels = (
  product: Product,
  appMenu: readonly string[]
): readonly string[] =>
  appMenu.map((action) => resolveAppMenuActionLabel(product, action));

const productNavConfig = {
  [Product.NUCLEUM]: {
    appMenu: [Action.CALENDAR, Action.OVERVIEW, Action.LIBRARY] as const,
    appMenuDev: [
      Action.HOME,
      Action.CALENDAR,
      Action.OVERVIEW,
      appMenuActionIds.spaceBrowse,
      Action.LIBRARY
    ] as const,
    appMenuPt: [
      Action.CALENDAR,
      Action.LIBRARY_PORTRAIT,
      Action.OVERVIEW
    ] as const,
    homePath: Action.CALENDAR,
    homePathPt: Action.LIBRARY_PORTRAIT,
    librarySectionLabel: "Nucleum"
  },
  [Product.MEMOTRON]: {
    appMenu: [
      appMenuActionIds.nodeCreate,
      Action.CALENDAR,
      Action.OVERVIEW,
      Action.LIBRARY
    ] as const,
    appMenuPt: [] as const,
    homePath: Action.CALENDAR,
    homePathPt: Action.MOBILEHOME,
    librarySectionLabel: "Memory"
  },
  [Product.POINTRON]: {
    appMenu: [
      PointronAction.FOCUS,
      Action.CALENDAR,
      Action.OVERVIEW,
      Action.LIBRARY
    ] as const,
    appMenuPt: [
      Action.OVERVIEW,
      Action.CALENDAR,
      PointronAction.FOCUS,
      Action.LIBRARY_PORTRAIT
    ] as const,
    homePath: Action.CALENDAR,
    homePathPt: PointronAction.FOCUS,
    librarySectionLabel: "Focus"
  }
} satisfies Partial<Record<Product, IProductNavConfig>>;

export const getProductNavConfig = (product: Product): IProductNavConfig => {
  const nav = productNavConfig[product];
  if (!nav) throw new Error(`Missing nav config for product: ${product}`);
  return nav;
};

/** E2E: nav button labels for the landscape app menu, in order. */
export const getAppMenuNavLabels = (product: Product): readonly string[] => {
  const nav = productNavConfig[product];
  if (!nav) throw new Error(`Missing nav config for product: ${product}`);
  return resolveAppMenuNavLabels(product, nav.appMenu);
};
