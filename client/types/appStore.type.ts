import type { IAction } from "@21n/types/action.type";
import type { InteractionMode } from "@nucleum/components/settings/interactionMode/interactionMode.type";
import type { IMetadata } from "@21n/layout/metadata.type";
import type { Product } from "@nucleum/products/product.type";
import type { OAuthProviderConfig } from "@21n/types/oauth.type";
export type IAppStore = {
  product: Product;
  env: string;
  version?: string;
  build?: number;
  appData: Partial<IAppData>;
  isDebugMode: boolean;
  isExperimentalMode: boolean;
  isDnDPageActive?: boolean;
  isMinimalTopBar?: boolean;
  pageMenu?: string[];
  //TACO - dynamic actions
  dynamicBlocks?: IAction[];
  currentPath: string;
  isMenuHidden?: boolean;
  currentComponent?: IAction;
  sheetPath?: string;
  actions: IAction[];
  /**
   * Derived value from uiState. This is to avoid the dependency of appStore on uiState as appStore is used non-logged in user context.
   */
  interactionMode: InteractionMode;
};

export type IAppData = {
  name: string;
  /**
   * @deprecated - use availability instead
   */
  version: string;
  /**
   * @deprecated - use release instead
   */
  updated?: string;
  release?: any;
  availability?: any;
  help?: any;
  /**
   * @deprecated - use product.config instead
   */
  cp?: any;
  shortcuts?: any;
  /**
   * @deprecated - use product.config instead
   */
  configurableShortcuts?: string[];
  /**
   * @deprecated - use product.config instead
   */
  appMenu?: string[];
  /**
   * @deprecated - use product.config instead
   */
  appMenuMobile?: string[];
  oAuthConfig?: OAuthProviderConfig[];
  isAnalyticsEnabled?: boolean;
  isCmdBarEnabled?: boolean;
  /**
   * @deprecated - use product.config instead
   */
  isShowCaptureOnMobile?: boolean;
  leftPanelFooter?: string;
  bottomRightAction?: string;
  auth?: {
    isInviteOnly?: boolean;
  };
  /**
   * @deprecated
   */
  md?: Record<string, string>;
  /**
   * @deprecated
   */
  about?: string;
  /**
   * @deprecated
   */
  env?: Record<string, any>;
  urls: {
    appStore?: string;
    microsoftStore?: string;
    playStore?: string;
    discord: string;
    soft: string;
    landing?: string;
    earlyAccess?: string;
    kbLinkTags?: string;
    chromeExtension?: string;
    docs?: string;
    guides?: string;
    onboardingVideo?: string;
    supahub?: string;
    hashnode?: string;
    statusPage?: string;
    systemStatusJson?: string;
    systemStatusEmbed?: string;
    changelogEmbed?: string;
    roadmapEmbed?: string;
    privacy?: string;
    [key: string]: string | undefined;
  };
  meta?: IMetadata;
};

export enum AppSearchParam {
  RETURN_TO = "returnTo",
  BACK = "back",
  EDIT = "edit",
  TYPE = "type",
  /**
   * Should be used only with some prefix like recordId etc... Otherwise it will conflict with ResourceAccessMode.TAB
   */
  TAB = "tab",
  PANEL = "panel",
  VIEW = "view",
  LINK = "link",
  BULK = "bulk",
  MODE = "mode",
  CLIPBOARD = "clipboard",
  RESOURCE = "resource",
  STARRED = "starred",
  ARCHIVED = "archived",
  DATE = "date",
  SETTING = "setting",
  CODE = "code",
  TOKEN = "token",
  MSG = "msg",
  EXT = "ext",
  PROVIDER = "provider",
  GUEST = "guest",
  POP_AT = "popAt",
  FSPLIT_AT = "fsplitAt",
  SPLIT_AT = "splitAt",
  FULL_AT = "fullAt",
  DEPTH = "depth",
  TRAVERSE = "traverse",
  NODE_VIEW = "nodeView",
  /**
   * @deprecated - use MAIN access mode instead
   */
  SEARCH = "search",
  /**
   * @deprecated - use RIGHT access mode instead
   * Opening an action in right panel
   */
  RIGHT = "right",
  /**
   * Whether to maximize the resource or not
   */
  MAX = "max"
}

export enum Context {
  CONTAINER = "container",
  NODE = "node",
  MARKDOWN = "markdown",
  CONTENT = "content",
  CAPTURE = "capture",
  BLOCK = "block",
  CALENDAR_CONTENT = "calendar-content"
}
