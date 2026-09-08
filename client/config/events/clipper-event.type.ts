export enum ClipperExtensionEvent {
  /**
   * Event to communicate to side panel from content script when clips are altered.
   */
  CLIPS_CHANGED = "CLIPS_CHANGED",
  /**
   *
   * @deprecated - use ExtensionEvent.PAGE_STATE instead for exchanging page state between content script and side panel.
   *
   * Event to communicate about the status of saving a page between content script and side panel.
   */
  PAGE_SAVING_STATUS = "PAGE_SAVING_STATUS",
  /**
   * Event to communicate about the order of text highlights between content script and side panel.
   */
  RESOLVE_TEXT_HIGHLIGHTS_ORDER = "RESOLVE_TEXT_HIGHLIGHTS_ORDER",
  /**
   * Event to communicate about taking a screenshot between content script and background script.
   */
  SCREENSHOT = "screenshot",
  /**
   * Event to relay saving web page from side panel or background script -> to content script to parse web page content and save it.
   */
  SAVE_WEBPAGE = "SAVE_WEBPAGE",
  /**
   * Event to relay taking screenshot from side panel or background script -> to content script to take screenshot.
   */
  TAKE_SCREENSHOT_SHORTCUT = "TAKE_SCREENSHOT_SHORTCUT",
  /**
   * Event to trigger refreshing of clips rendering on the content script.
   */
  REFRESH_CLIPS_RENDERING = "REFRESH_CLIPS_RENDERING",
  /**
   * Relayed from side panel to content script when any clip is mutated like editing notes, links or deleting etc or webpage notes is mutated.
   */
  MUTATION_RELAY = "MUTATION_RELAY",
  /**
   * Event to trigger syncing of highlights from sync pages.
   */
  START_SYNC = "START_SYNC",
  /**
   * Event to trigger refreshing of a clip from content script to side panel when the clip is mutated from content script.
   */
  REFRESH_CLIP = "REFRESH_CLIP",
  /**
   * Event to trigger minimizing of toolbar from side panel to content script.
   */
  MINIMIZE_TOOLBAR = "MINIMIZE_TOOLBAR",
  /**
   * Event to trigger closing of toolbar from side panel to content script.
   */
  TOGGLE_TOOLBAR_VISIBILITY = "TOGGLE_TOOLBAR_VISIBILITY",
  /**
   * Event to trigger activating of link box.
   */
  ACTIVATE_LINK_BOX = "ACTIVATE_LINK_BOX",
  /**
   * Event to trigger when link is added. Side panel listens to this event to refresh the collection items view.
   */
  ON_COLLECTION_LINK_CHANGES = "ON_COLLECTION_LINK_CHANGES"
}
export enum ClipperElementIdentifier {
  MAIN_TWEET_POST = "memotron-clipper-main-tweet-post"
}
