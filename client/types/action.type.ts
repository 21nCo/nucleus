import type { Resource } from "@nucleum/datafn/resource.enum";
import type { AccessMode } from "@nucleum/datafn/resource.type";
import type { UserDataMode } from "@21n/types/account.type";
import {
  Embed,
  OperatingSystem,
  type IAppContext
} from "@21n/types/context.type";
import type { ConfirmationNotification } from "@21n/types/notification.type";
import type { ModalParams } from "@21n/types/popup.type";
import type { IViewStore } from "@21n/types/view.type";
import type { Size } from "./size.enum";

export type IAction = {
  action: string;
  type: ActionType;
  /**
   * If true, the action will not be shown in command bar.
   */
  isMeta?: boolean;
  /**
   * @deprecated -
   * TODO - check the need for this
   */
  path?: string;
  /**
   * function to be called when the action is triggered if the type is {@link ActionType.FUNCTION}
   * @param params
   * @returns
   */
  fn?: (params?: IActionFnParams) => Promise<any>;
  /**
   * The pre condition to be met in order for the action to be shown in command bar.
   * @returns true if the action is shown in command bar, false otherwise.
   */
  preCondition?: () => boolean;
  /**
   * Svelte component associated with the action. This is required if the type is {@link ActionType.MODAL} or {@link ActionType.PAGE}
   */
  component?: any;

  panel?: any;
  /**
   * Label to be shown in command bar or anywhere else in the app.
   */
  label?: string;
  /**
   * Additional labels for the same action - to improve findability in command bar.
   */
  cmdLabel?: string | { variant: string; label: string }[];
  /**
   * Icon associated with the action.
   */
  icon?: string;
  /**
   * @deprecated
   */
  sections?: string[];
  /**
   * @deprecated
   */
  pagePaint?: PaintType;
  /**
   * @deprecated
   */
  thinModeBehavior?: ThinModeBehavior;
  /**
   * @deprecated
   */
  contentType?: ContentType;
  associatedPlayer?: string;
  /**
   * @deprecated - not used anywhere
   */
  context?: string;
  /**
   * @deprecated - not used anywhere
   */
  params?: any;
  /**
   * If true, app menu will be hidden for this action.
   */
  isMenuHidden?: boolean;
  isInactive?: boolean;
  /**
   * Details of the modal to be shown when the action is triggered if the type is {@link ActionType.MODAL}
   */
  modalParams?: ModalParams;
  /**
   * Details of the confirmation to be shown when the action type is {@link ActionType.CONFIRMATION}
   */
  confirmation?: ConfirmationNotification;
  /**
   * Loading animation component to be shown when the action type is {@link ActionType.PAGE} or {@link ActionType.MODAL}
   */
  loadingComponent?: any;
  /**
   * Search action params to be used when the action type is {@link ActionType.SEARCH_CMD}
   */
  searchActionParams?: {
    searchCallback?: (search: string, componentParams?: any) => Promise<any>;
    /**
     * @deprecated - use placeholder instead
     */
    itemLabel?: string;
    placeholder?: string | ((params?: any) => string);
    searchResultComponent?: any;
    callback: (item: any, componentParams?: any) => void;
    /**
     * Resource type of search results if already pre-known.
     */
    searchResourceType?: Resource;
  };
  /**
   * Contexts in which the action will be hidden.
   *
   * Ex: Useful to hide certain settings on mobile devices or for certain users.
   */
  hideContext?: (Embed | OperatingSystem | UserDataMode)[];

  /**
   * Used in conjunction with {@link ActionType.RESOURCE} to specify the access mode of the resource.
   */
  accessMode?: AccessMode;

  /**
   * Svelte component to render the label of the resource.
   * Used in contexts like Top bar tabs, search etc
   */
  resourceLabelRenderer?: any;

  /**
   * If true, the action will be rendered as a page in portrait mode irrespective of the action type like Modal or Resource.
   */
  isRenderAsPageInPortrait?: boolean;

  /**
   * Params will be passed via PagePainter -> ComponentResolver
   */
  componentParams?: any;

  /**
   * Type of action specific to mobile behavior.
   */
  handsetBehaviorType?: ActionType;
  /**
   * Params for live actions when opened in right panel or in main panel
   */
  liveActionParams?: ILiveActionParams;
};

export type ILiveActionParams = {
  size?: Size;
  isOpeningBehaviorConfigurable?: boolean;
};

export type IActionFnParams = {
  componentParams?: any;
  searchParams?: Record<string, string | boolean | number>;
  view?: IViewStore;
  context?: IAppContext;
};

export enum ActionType {
  PAGE = "PAGE",
  /**
   * Link action will open a link in a new tab if the context is web or
   * will open in app browser if the context is embed.
   */
  LINK = "LINK",
  /**
   * Modal action will open a modal.
   */
  MODAL = "MODAL",
  INLINE = "INLINE",
  /**
   * Function action will execute a function.
   */
  FUNCTION = "FUNCTION",
  CONFIRMATION = "CONFIRMATION_MODAL",
  SEARCH_CMD = "SEARCH_CMD",
  /**
   * Triggers an event - subscribers will take care of the action.
   */
  EVENT = "EVENT",
  /**
   * Action will be opened as a resource.
   */
  RESOURCE = "RESOURCE",
  /**
   * Component specifically for caching.
   */
  CACHE = "CACHE",
  /**
   * Actions that can take full page or can run on the right panel
   */
  LIVE = "LIVE"
}

/**
 * @deprecated
 */
export enum PaintType {
  YSTACK,
  XSTACK,
  YMENU,
  XMENU,
  PANEL_ON_LEFT,
  JUMP_TO_PARENT
}

/**
 * @deprecated
 */
export enum ThinModeBehavior {
  JUMP_TO_PARENT,
  GRAND_CHILDREN_ON_MENU,
  RIGHT_PANEL_AS_PLAYER,
  YSTACK,
  HIDE
}

/**
 * @deprecated
 */
export enum ContentType {
  BLOCK,
  SECTION,
  INLINE,
  BUTTON,
  TOGGLE,
  SPACE_DOC
}
