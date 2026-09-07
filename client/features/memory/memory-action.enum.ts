export enum MemotronAction {
  PREVIEW_IMAGE_UPLOADER = "preview-image-uploader",
  /**
   * @deprecated - use resourceAction(Resource.collection, ResourceActionType.CREATE) instead
   */
  CAPTURE = "capture",
  /**
   * Capture drag and drop listener of files from outside the app.
   */
  CAPTURE_DND = "capture-dnd",
  CAPTURE_SECONDARY = "capture2",
  JOURNAL_MODAL_VIEWER = "journal-modal-viewer",
  SERENDIPITY = "serendipity",
  PUBLISH = "publish",
  HISTORY = "history",
  /**
   * @deprecated - use resourceAction(Resource.property, ResourceActionType.EDIT) instead
   */
  EDIT_COLLECTION_PROPERTIES = "edit-collection-properties",
  CREATE_TYPE = "create-type",
  LIBRARY = "library",
  SEARCH = "search",
  PASTE_CONFIRMATION = "paste-confirmation",
  /**
   * @deprecated - use Action.ADD_ITEM_TO_COLLECTION instead
   */
  ADD_NODE_TO_COLLECTION = "add-node-to-collection",
  /**
   * @deprecated - use Action.BULK_LINK instead
   */
  BULK_LINK = "bulk-link",
  OPEN_CHAT = "open-chat",
  CALLOUT_SETTINGS = "edit-callout-settings",
  IMPORT_APP_DATA = "import-app-data",
  EDIT_CAPTURE_SHORTCUTS = "edit-capture-shortcuts",
  CAPTURE_SETTINGS = "capture-settings",
  RELATIONS_AS_SETTINGS = "relations-as-settings",
  ACTIVATE_LINK_BOX = "ACTIVATE_LINK_BOX",
  NODE_SETTINGS = "node-settings"
}
