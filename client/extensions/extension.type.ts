export enum ExtensionEvent {
  /**
   * @deprecated - use TAB_UPDATE instead
   * A tab change event - sent from background script.
   */
  TAB_CHANGE = "TAB_CHANGE",
  /**
   * A tab update event - sent from background script.
   */
  TAB_UPDATE = "TAB_UPDATE",
  /**
   * A click event from any resource click on side panel - to show relevant state in content scripts.
   */
  CLICK_FROM_SIDEPANEL = "CLICK_FROM_SIDEPANEL",
  /**
   * An event to toggle (open or close) side panel - typically sent from content script.
   */
  TOGGLE_SIDEPANEL = "TOGGLE_SIDEPANEL",
  /**
   * An event to exchange the state of the page - published from content script.
   */
  PAGE_STATE = "PAGE_STATE",
  /**
   * An event to trigger the state of the page - typically sent from side panel and relayed to conent script so that content script can publish the state using {@link ExtensionEvent.PAGE_STATE} event.
   */
  PAGE_STATE_TRIGGER = "PAGE_STATE_TRIGGER",
  /**
   * @deprecated - use UPLOAD_FILE instead
   */
  UPLOAD_TO_S3_USING_UPLOAD_URL = "UPLOAD_TO_S3_USING_UPLOAD_URL",
  /**
   * An event to delegate flux to the background script.
   */
  FLUX_DELEGATION = "flux",
  LOGIN = "login",
  LOGOUT = "logout",
  TOKEN_NOT_FOUND = "token_not_found",
  UPLOAD_FILE = "upload",
  RUN = "run",
  /**
   * An event that is sent to Sidepanel when extension is booted up. To load in memory stores.
   */
  BOOTUP = "bootup",
  /**
   * Triggered by flux from background script to side panel and content script so that operations like reloading in memory stores can be performed.
   */
  MUTATION = "mutation",
  /**
   * Triggered by flux from background script to side panel and content script so that operations like reloading in memory stores can be performed.
   */
  API_CALL = "api_call",
  /**
   * Triggered by background script to notify content script that side panel is opened.
   */
  SIDEPANEL_OPENED = "sidepanel_opened",
  /**
   * Triggered by background script to notify content script that side panel is closed.
   */
  SIDEPANEL_CLOSED = "sidepanel_closed"
}

export type TabBaseData = {
  url: string;
  label: string;
  description?: string;
};

/**
 * @deprecated - use IWebPageNode instead
 */
export type TabData = TabBaseData & {
  metadata: TabMetadata;
  hash?: string;
  bodyContent?: string;
};

/**
 * @deprecated - use IWebPageMetadata instead
 */
export type TabMetadata = {
  favicon?: string;
  faviconLink?: string;
  appIconLinks?: string[];
  keywords?: string;
  hostname?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
};
