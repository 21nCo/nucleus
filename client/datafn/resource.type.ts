import type { IObservableStore } from "@21n/types/data.type";
import type {
  IMutationAdditionalParams,
  IRecordId
} from "@21n/types/data.type";
import type { Resource } from "@nucleum/datafn/resource.enum";

export type DatafnDateValue = Date | string | number;

export interface IResourceBase {
  id: IRecordId;
  createdAt: DatafnDateValue;
}

export interface IResource extends IResourceBase {
  /**
   * The last time the resource was updated
   */
  updatedAt: DatafnDateValue;
  trashedAt?: DatafnDateValue | null;
  trashedBy?: IRecordId | string | null;
}

export interface IResourceLabeled {
  label?: string;
}

export interface IResourceShareable {
  createdBy?: IRecordId | null;
  updatedBy?: IRecordId | null;
}

export interface IResourceStarrable {
  isStarred?: boolean;
}

export interface IResourceArchivable {
  /**
   * Whether the resource is archived or not
   */
  isArchived?: boolean;
}

export interface IResourceLockable {
  /**
   * Whether the resource is locked for editing or not
   */
  isLocked?: boolean;
}

export interface IResourceInActivableFromAncestor {
  /**
   * Whether the resource is inactive because an ancestor is inactive
   */
  isAncestorInactive?: boolean;
}

export interface IResourceImportable {
  importId?: string;
}

/**
 * Meta resource are created by system and are not meant to be created by the user. Ex: mutation, accessLog, etc.
 */
export interface IMetaResource extends IResourceBase {
  updatedAt: DatafnDateValue;
  [key: string]: unknown;
}

export interface IActiveResource extends IResource {
  accessMode: AccessMode;
  /**
   * All editing features will be turned on if this is true.
   * Example: collection, combination, media node, etc.
   */
  isInEditMode?: boolean;
  /**
   * Editing will be temporarily disabled for the resource if this is true.
   * Example: markdown node.
   */
  isInReadOnlyMode?: boolean;
  /**
   * Additional UI elements will be hidden if this is true to improve the focus on the resource editing or writing.
   * Example: markdown node.
   */
  isInFocusMode?: boolean;
}

export type IUnlabeledResource<
  T extends IResource & IResourceLabeled = IResource & IResourceLabeled
> = Omit<T, "label">;

export enum AccessMode {
  INLINE = "inline",
  /**
   * Inline split
   */
  SPLIT = "split",
  /**
   * Split in full screen or pop mode
   */
  FSPLIT = "fsplit",
  /**
   * Pop mode
   */
  POP = "r",
  /**
   * Full screen mode
   */
  FULL = "full",
  TAB = "tab",
  OPEN_IN_BACKGROUND = "open-in-background",
  SLIDESHOW = "slideshow",
  SHEET = "sheet",
  RIGHT = "right",
  MAIN = "m"
}

export enum ResourceActionType {
  BROWSE = "browse",
  OPEN = "open",
  CREATE = "create",
  EDIT = "edit",
  ARCHIVE = "archive",
  UNARCHIVE = "unarchive",
  DELETE = "delete",
  RESTORE = "restore",
  SHARE = "share",
  EXPORT = "export",
  FOCUS = "focus",
  PIN = "pin",
  UNPIN = "unpin",
  SELECT = "select",
  STAR = "star",
  UNSTAR = "unstar",
  DUPLICATE = "duplicate",
  LOCK = "lock",
  UNLOCK = "unlock",
  LINK = "link",
  UNLINK = "unlink",
  ADD_TO = "ADD_TO",
  MOVE = "move",
  CONVERT = "convert",
  REMOVE_FROM = "REMOVE_FROM",
  EDIT_TITLE = "EDIT_TITLE",
  EDIT_LINKS = "EDIT_LINKS",
  EDIT_NOTES = "EDIT_NOTES",
  EDIT_COVER = "EDIT_COVER",
  COPY_LINK = "COPY_LINK",
  COPY_CONTENTS = "COPY_CONTENTS",
  TOGGLE_READ_MODE = "TOGGLE_READ_MODE",
  TOGGLE_FOCUS_MODE = "TOGGLE_FOCUS_MODE",
  SET_COVER_PHOTO = "SET_COVER_PHOTO"
}

/**
 * Where the resource is being accessed from. This is used to determine the context and thus context menu to be shown or thumbnail sizing etc.
 */
export enum ResourceAccessPoint {
  /**
   * The resource is being accessed from the resource browser page.
   */
  BROWSER = "browser",
  /**
   * The resource is being accessed from the library.
   */
  LIBRARY = "library",
  /**
   * The resource is being accessed from the journal.
   */
  JOURNAL = "journal",
  /**
   * The resource is being accessed from the top bar by pinning it.
   */
  TABS = "tabs",
  /**
   * The resource is being accessed from the resource page.
   */
  SELF = "self",
  OTHER = "other",
  /**
   * The resource is being accessed from the node page
   */
  NODE = "node",
  /**
   * The resource is being accessed from the node links pane
   */
  NODE_LINKS = "nodelinks",
  /**
   * The resource is being accessed from the default right pane
   */
  DEFAULT_RIGHT_PANE_LINKS = "defaultrightpanelinks",
  /**
   * The resource is being accessed from the node clips pane
   */
  NODE_TRACES = "nodetraces",
  /**
   * The resource is being accessed from the node page
   */
  COLLECTION = "collection",
  SEARCH_RESULT = "searchresult",
  /**
   * The resource is being accessed from the markdown embed
   */
  MARKDOWN_EMBED = "markdownembed",

  MARKDOWN_MENTION = "markdownmention",

  MARKDOWN = "markdown",
  /**
   * The resource is being accessed from the combination
   */
  COMBINATION = "combination",
  CAPTURE = "capture",
  CLIPPER = "clipper",
  /**
   * Any pickers like cover picker, focus items picker etc.
   */
  PICKER = "picker",
  /**
   * The resource is being accessed from a creation form
   */
  FORM = "form",
  /**
   * The resource is being accessed from an objective
   */
  OBJECTIVE = "objective",
  /**
   * The resource is being accessed from focus pages
   */
  FOCUS = "focus",
  /**
   * The resource is being accessed from calendar
   */
  CALENDAR = "calendar",
  /**
   * The resource is being accessed from analytics
   */
  ANALYTICS = "analytics",
  /**
   * The resource is being accessed from the map
   */
  MAP = "map"
}

export enum ResourceAccessPointState {
  DEFAULT = "default",
  /**
   * During edit like single or bulk edit in access point like browser, library, etc.
   */
  EDIT = "edit",
  /**
   * During search in the access point like browser, library, etc.
   */
  SEARCH = "search"
}

/**
 * @deprecated - doesn't help with type inference if nested type intersections. Use {@link OmitForCapture} or {@link OmitFields} instead.
 */
export type IResourceCapture<T extends IResource> = Omit<
  T,
  | "createdAt"
  | "updatedAt"
  | "createdBy"
  | "updatedBy"
  | "interactedAt"
  | "id"
>;

export type IResourceCaptureV2<T extends IResource> = OmitForCapture<T>;

/**
 * @deprecated - doesn't help with type inference if nested type intersections. Use {@link OmitForCaptureWithId} or {@link OmitFields} instead.
 */
export type IResourceCaptureWithId<T extends IResource> = Omit<
  T,
  "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "interactedAt"
>;

export type CaptureOmittedFields =
  | "createdAt"
  | "updatedAt"
  | "createdBy"
  | "updatedBy"
  | "interactedAt"
  | "id"
  | "parent";

export type OmitForCapture<T> = {
  [K in keyof T as Exclude<K, CaptureOmittedFields>]: T[K];
} & {
  [K in Extract<keyof T, CaptureOmittedFields>]?: T[K];
};

export type OmitForCaptureWithId<T> = {
  [K in keyof T as Exclude<K, CaptureOmittedFields>]: T[K];
} & {
  id: IRecordId;
};

export type OmitFields<T, K extends keyof T> = {
  [P in keyof T as Exclude<P, K>]: T[P];
} & {
  [P in K]?: T[P];
};

export interface IMultiSelectContext {
  resource: Resource;
  accessPoint: ResourceAccessPoint;
  accessPointId?: IRecordId;
}

export interface IMultiSelectStore extends IObservableStore<IRecordId[]> {
  context: IMultiSelectContext;
}

export type IResourceMutationParams = IMutationAdditionalParams & {
  /**
   * Whether the mutation should prevent back propagated to active resource stores
   */
  isPreventBackPropagation?: boolean;
  /**
   * @deprecated - use debouncer at source instead
   * Whether the mutation persistance should be debounced
   */
  isDebounced?: boolean;
  /**
   * The key to be used for debouncing the mutation
   */
  debounceKey?: string;

  /**
   * Whether the mutation should be applied as a system change i.e. updatedBy and updatedAt are not set - with the properties passed and persists the change. If an active resource is present, it will be updated with the new properties unless isPreventBackPropagation is true.
   */
  isModifyAsSystem?: boolean;
};

export interface IResourcePageWithPanels {
  id: IRecordId;
  panel: string;
  defaultPanel: string;
  isInFocusMode?: boolean;
  isInEditMode?: boolean;
  switchPanel: (panel?: string) => void;
  closeEditMode: () => void;
}
