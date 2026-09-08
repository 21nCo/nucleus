import type { ClipperExtensionEvent } from "@nucleum/client/config/events/clipper-event.type";
import type { PointronEvent } from "@nucleum/client/config/events/focus-event.enum";
import type { MemotronEvent } from "@nucleum/client/config/events/memory-event.enum";
export type Event =
  | GlobalEvent
  | PointronEvent
  | ClipperExtensionEvent
  | MemotronEvent;

export enum GlobalEvent {
  NONE = "NONE",
  EVENT = "event",
  SHOW_APPEARANCE_PREVIEW = "SHOW_APPEARANCE_PREVIEW",
  USER_LOGIN = "USER_LOGIN",
  USER_SIGNUP = "USER_SIGNUP",
  BOOTSTRAP = "BOOTSTRAP",
  CUSTOM_NAVIGATION = "custom:navigation",
  PERSIST_APPEARANCE_USER = "PERSIST_APPEARANCE_USER",
  CUSTOM_ALERT = "custom:alert",
  ACTIVATE_SEARCH_BOX = "ACTIVATE_SEARCH_BOX",
  ENTER = "Enter",
  ESCAPE = "Escape",
  HIDE_POPOVER = "hidePopover",
  APP_MENU_SWITCHED = "APP_MENU_SWITCHED",
  /**
   * @deprecated - using full screen/maximize for resources instead
   */
  FOCUS_MODE = "focusMode",
  APP_LOADING_STATUS = "appLoadingStatus",
  /**
   * Listened to in ResourceResolver - to reload entire loaded resource
   */
  RELOAD_RESOURCE = "reloadResource",
  SEARCH_RESULT_KEYUP = "searchresultkeyup",
  SEARCH_RESULT_KEYDOWN = "searchresultkeydown",
  ADD_TO_RECENTS = "addToRecents",
  TOGGLE_SEARCH_PARAM = "toggleSearchParam",
  COLLAPSE_PANEL = "collapsePanel",
  EXPAND_PANEL = "expandPanel",
  INLINE_TOAST = "inlinetoast",
  NAV = "nav"
}

export enum PlayActionState {
  NOT_STARTED = "NOT_STARTED",
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  STOPPED = "STOPPED",
  PREVIEWING = "PREVIEWING",
  PAUSEPREVIEWING = "PAUSEPREVIEWING",
  RESUMEPREVIEWING = "RESUMEPREVIEWING"
}
