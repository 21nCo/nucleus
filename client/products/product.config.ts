import { Extension, OverviewPanel, Product } from "@21n/types/product.type";
import { getProductNavConfig } from "@nucleum/client/config/product-nav.config";
import { Resource } from "@nucleum/datafn/resource.enum";
import { Action } from "@21n/types/action.enum";
import { MemotronAction } from "@nucleum/features/memory/memory-action.enum";
import type { ISelectItem } from "@21n/types/select.type";
import {
  nextProducts,
  nextResourceTableMap,
  nextNucleusOverviewPanelSwitcherItems
} from "@nucleum/next/product.config";
import {
  resolveProductResourceConfig,
  sharedExtensions,
  productRegistry
} from "@nucleum/schema/product.config";
import type { IProductConfigBase as ISharedProductConfigBase } from "@nucleum/schema/product.config";

const isDev = import.meta.env?.DEV || false;

interface SettingsSection {
  children: (Action | MemotronAction | string)[];
  isHideTitle?: boolean;
  orientation?: "horizontal" | "vertical";
  section: string;
}

type IProductConfigBase = ISharedProductConfigBase;

export interface IAppConfigBase extends IProductConfigBase {
  /**
   * @deprecated
   */
  version?: string;
  /**
   * @deprecated
   */
  build?: number;
  /**
   * App menu for landscape mode
   */
  appMenu: string[];
  /**
   * App menu for portrait mode
   */
  appMenuPt: string[];
  /**
   * Home path for landscape mode
   */
  homePath: string;
  /**
   * Home path for portrait mode
   */
  homePathPt: string;
  isShowCaptureOnMobile?: boolean;
  settings?: SettingsSection[];
  databaseName?: string;
  librarySectionLabel?: string;
  configurableShortcuts?: string[];
  oAuthProviders?: ("google" | "apple" | "github")[];
  overviewPanelSwitcherItems?: ISelectItem[];
}

type IAppConfig = IAppConfigBase;

type IExtensionConfig = IProductConfigBase;

const commonConfigurableShortcuts = [
  Action.EDIT_MODE,
  Action.CMD,
  Action.SEARCH,
  Action.GO_BACK,
  Action.GO_FORWARD
];

const nucleusNav = getProductNavConfig(Product.NUCLEUM);
const memotronNav = getProductNavConfig(Product.MEMOTRON);
const pointronNav = getProductNavConfig(Product.POINTRON);

const resolveBaseSharedProductConfig = (productName: Product) =>
  productRegistry[productName.toString() as keyof typeof productRegistry];

const uniqueResources = (resources: Resource[]) =>
  Array.from(new Set(resources));

const resolveClientProductResources = (productName: Product) => {
  const sharedResources = resolveProductResourceConfig(productName, { isDev });
  const nextTables =
    productName === Product.NUCLEUM
      ? Array.from(Object.values(nextResourceTableMap)).flat()
      : (nextResourceTableMap[
          productName as keyof typeof nextResourceTableMap
        ] ?? []);
  return {
    browse: sharedResources.browse as Resource[],
    table: uniqueResources([
      ...(sharedResources.table as Resource[]),
      ...(nextTables as Resource[])
    ])
  };
};

export const products: Record<string, IAppConfigBase> = {
  [Product.NUCLEUM]: {
    ...resolveBaseSharedProductConfig(Product.NUCLEUM),
    appMenu: (isDev && nucleusNav.appMenuDev
      ? nucleusNav.appMenuDev
      : nucleusNav.appMenu) as string[],
    appMenuPt: [...nucleusNav.appMenuPt],
    homePath: nucleusNav.homePath,
    homePathPt: nucleusNav.homePathPt,
    resources: resolveClientProductResources(Product.NUCLEUM),
    librarySectionLabel: nucleusNav.librarySectionLabel,
    configurableShortcuts: [
      ...commonConfigurableShortcuts,
      "SAVE_CAPTURE_SHORTCUT",
      "ACTIVATE_LINK_BOX"
    ],
    overviewPanelSwitcherItems: [
      { label: "Dashboard", value: OverviewPanel.DASHBOARD, icon: "overview" },
      { label: "Graph", value: OverviewPanel.GRAPH, icon: "graph" },
      ...nextNucleusOverviewPanelSwitcherItems
    ],
    settings: [
      {
        children: [
          Action.SYNC_SETTINGS,
          Action.ARTIFICIAL_INTELLIGENCE,
          Action.DATA_SETTINGS,
          Action.USER_BILLING
        ],
        isHideTitle: true,
        orientation: "horizontal",
        section: "app"
      },
      {
        children: [
          Action.MODE_OF_INTERACTION,
          Action.APPEARANCE_SETTINGS,
          "analytics-settings",
          "session-settings",
          MemotronAction.NODE_SETTINGS,
          Action.DATETIME_SETTINGS,
          Action.SHORTCUTS,
          Action.ACCESSIBILITY
        ],
        section: "customization"
      },
      {
        children: [
          "about",
          "green",
          "share",
          "guides",
          "feedback",
          "privacy",
          "discord"
        ],
        isHideTitle: true,
        section: "other"
      }
    ]
  },
  [Product.MEMOTRON]: {
    ...resolveBaseSharedProductConfig(Product.MEMOTRON),
    appMenu: [...memotronNav.appMenu],
    appMenuPt: [...memotronNav.appMenuPt],
    homePath: memotronNav.homePath,
    homePathPt: memotronNav.homePathPt,
    isShowCaptureOnMobile: true,
    resources: resolveClientProductResources(Product.MEMOTRON),
    librarySectionLabel: memotronNav.librarySectionLabel,
    configurableShortcuts: [
      ...commonConfigurableShortcuts,
      "SAVE_CAPTURE_SHORTCUT",
      "ACTIVATE_LINK_BOX"
    ],
    settings: [
      {
        children: [
          MemotronAction.RELATIONS_AS_SETTINGS,
          Action.SYNC_SETTINGS,
          Action.ARTIFICIAL_INTELLIGENCE,
          Action.DATA_SETTINGS,
          Action.USER_BILLING
        ],
        isHideTitle: true,
        orientation: "horizontal",
        section: "app"
      },
      {
        children: [
          Action.MODE_OF_INTERACTION,
          Action.APPEARANCE_SETTINGS,
          MemotronAction.NODE_SETTINGS,
          Action.DATETIME_SETTINGS,
          Action.SHORTCUTS,
          Action.ACCESSIBILITY
        ],
        section: "customization"
      },
      {
        children: [
          "about",
          "green",
          "share",
          "guides",
          "feedback",
          "privacy",
          "discord"
        ],
        isHideTitle: true,
        section: "other"
      }
    ]
  },
  [Product.POINTRON]: {
    ...resolveBaseSharedProductConfig(Product.POINTRON),
    appMenu: [...pointronNav.appMenu],
    appMenuPt: [...pointronNav.appMenuPt],
    homePath: pointronNav.homePath,
    homePathPt: pointronNav.homePathPt,
    resources: resolveClientProductResources(Product.POINTRON),
    librarySectionLabel: pointronNav.librarySectionLabel,
    settings: [
      {
        children: [
          Action.SYNC_SETTINGS,
          Action.DATA_SETTINGS,
          Action.USER_BILLING
        ],
        isHideTitle: true,
        orientation: "horizontal",
        section: "app"
      },
      {
        children: [
          Action.MODE_OF_INTERACTION,
          Action.APPEARANCE_SETTINGS,
          "analytics-settings",
          "session-settings",
          Action.DATETIME_SETTINGS,
          Action.SHORTCUTS,
          Action.ACCESSIBILITY
        ],
        section: "customization"
      },
      {
        children: [
          "about",
          "green",
          "share",
          "guides",
          "feedback",
          "privacy",
          "discord"
        ],
        isHideTitle: true,
        section: "other"
      }
    ]
  },
  ...nextProducts
};

export const product =
  import.meta.env?.VITE_PRODUCT ||
  (typeof process !== "undefined"
    ? process.env?.PLASMO_PUBLIC_PRODUCT
    : undefined) ||
  Product.NUCLEUM;

export const resolveProductConfig = (productOverride?: Product): IAppConfig => {
  const base = products[productOverride ?? (product as Product)];
  if (!base) {
    throw new Error(`Unknown product: ${productOverride ?? product}`);
  }
  return {
    ...base,
    oAuthProviders: ["google", "apple", "github"]
  };
};

const extensions: Record<Extension, IProductConfigBase> = {
  [Extension.MEMOTRON_CLIPPER]: {
    name: "Memotron Clipper",
    resources: {
      browse: [],
      table: sharedExtensions[Extension.MEMOTRON_CLIPPER].resources
        .table as Resource[]
    },
    displayName: "Memotron Clipper",
    tagline: ""
  },
  [Extension.MEMOTRON_SHARE]: {
    name: "Memotron Share",
    resources: {
      browse: [],
      table: []
    },
    displayName: "Memotron Share",
    tagline: ""
  }
};

export const resolveExtensionConfig = (
  productOverride?: Extension
): IExtensionConfig => {
  const base = extensions[productOverride ?? (product as Extension)];
  return base;
};
