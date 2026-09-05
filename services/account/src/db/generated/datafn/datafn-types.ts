// @ts-nocheck
import type { DatafnClient, DatafnTable } from "@datafn/client";

export interface AccessLog {
  action?: string;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  event?: string;
  id: string;
  resource?: string;
  resourceId?: string;
  timestamp?: number;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  value?: unknown;
}

export interface Capture {
  avatar?: Record<string, unknown>;
  body?: unknown;
  childrenWithStructure: unknown[];
  clipboard?: unknown;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  file?: string;
  id: string;
  isArchived?: boolean;
  label?: string;
  links?: unknown[];
  method: string;
  nodeId?: string;
  propertyConfig?: unknown[];
  propertyValues?: unknown[];
  refreshId: number;
  rootStructure: unknown[];
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface Collection {
  avatar?: Record<string, unknown>;
  cover?: string;
  coverLayout?: Record<string, unknown>;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  description?: string;
  id: string;
  importId?: string;
  isArchived?: boolean;
  isCaptureShortcutEnabled?: boolean;
  isStarred?: boolean;
  label?: string;
  query?: string;
  resource: string;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  type: string;
  typeToExtend?: string | null;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface Event {
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  endUnix?: number;
  event: string;
  id: string;
  isArchived?: boolean;
  label?: string;
  startUnix?: number;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  value?: unknown;
  readonly visibility?: string | null;
}

export interface File {
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  data?: unknown;
  duration?: number;
  id: string;
  isArchived?: boolean;
  isMeta?: boolean;
  label?: string;
  metadata?: unknown;
  name?: string;
  size: number;
  thumbnailData?: unknown;
  thumbnailUrl?: string;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  type: string;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  url?: string;
  readonly visibility?: string | null;
}

export interface LinkTag {
  avatar?: Record<string, unknown>;
  color?: number;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  group?: string;
  id: string;
  isArchived?: boolean;
  label?: string;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface Node {
  avatar?: unknown[];
  body?: unknown;
  bodySearch?: string;
  config?: unknown;
  contentType: string;
  cover?: string;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  creationContext?: string;
  date?: number;
  file?: string;
  id: string;
  importId?: string;
  isAncestorInactive?: boolean;
  isArchived?: boolean;
  isLocked?: boolean;
  isStarred?: boolean;
  label?: string;
  labelSearch?: string;
  mdChildOrder?: unknown[];
  mdParent?: unknown[];
  mdText?: string;
  metadata?: unknown;
  metaType?: string;
  notes?: string;
  parent?: string;
  parentPath?: string;
  previewImage?: string;
  sortOrder?: number;
  text?: string;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  url?: string;
  readonly visibility?: string | null;
}

export interface Objective {
  color?: number;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  description?: unknown;
  endDate?: number;
  id: string;
  importId?: string;
  isAncestorInactive?: boolean;
  isArchived?: boolean;
  isLocked?: boolean;
  isPinnedForQuickFocus?: boolean;
  isStarred?: boolean;
  label?: string;
  parentId?: string | null;
  parentPath?: string;
  sortOrder?: number;
  spanScale?: string;
  startDate?: number;
  status: string;
  subObjectivesLayout?: string;
  tabsOrder?: unknown[];
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  type: string;
  uiState?: Record<string, unknown>;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface Property {
  avatar?: Record<string, unknown>;
  config?: unknown;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  defaultValue?: unknown;
  description?: string;
  id: string;
  importId?: string;
  isArchived?: boolean;
  isMulti?: boolean;
  isRequired?: boolean;
  isShowOnCapture?: boolean;
  isShowOnNodePage?: boolean;
  label?: string;
  options?: unknown[];
  order?: number;
  propertyType?: string;
  resource?: string;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  type?: string;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface PublicLink {
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  expiresAt?: number;
  id: string;
  level: string;
  principalId: string;
  recordId?: string;
  resource: string;
  resourceRegion?: string;
  revokedAt?: number;
  scope: string;
  tokenHash: string;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
}

export interface Session {
  blocks: unknown[];
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  elapsed: number;
  end?: string;
  endUnix: number;
  extended: number;
  id: string;
  isArchived?: boolean;
  manualEntryId?: string | null;
  notes?: unknown;
  plannedEnd?: string;
  plannedEndUnix?: number;
  start?: string;
  startUnix: number;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  type: string;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface SessionLog {
  breakTime?: number;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  end?: string;
  endUnix: number;
  focus?: number;
  id: string;
  isArchived?: boolean;
  manualEntryId?: string | null;
  objectiveId?: string | null;
  sessionId: string;
  start?: string;
  startUnix: number;
  targets?: unknown[];
  taskId?: string | null;
  taskName?: string;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  tzOffset?: number;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface Space {
  avatar?: Record<string, unknown>;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  description?: string;
  id: string;
  isArchived?: boolean;
  isStarred?: boolean;
  items: unknown[];
  label?: string;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  type: string;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface Task {
  completedAt?: number;
  completedAtUnix?: number | null;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  date?: number;
  dateUnix: number;
  estimated?: number;
  id: string;
  isAncestorInactive?: boolean;
  isArchived?: boolean;
  isChecked?: boolean;
  label?: string;
  minutes?: number;
  objectiveId?: string | null;
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface Vector {
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  embedding: unknown[];
  id: string;
  metadata?: unknown;
  resource: string;
  resourceId: string;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
}

export interface View {
  arrangement?: string;
  readonly createdAt?: number | null;
  readonly createdBy?: string | null;
  density?: number;
  groupBy?: string;
  id: string;
  importId?: string;
  isArchived?: boolean;
  isHideThumbnailPreview?: boolean;
  isHideThumbnailTitle?: boolean;
  label?: string;
  layout: string;
  properties?: unknown[];
  subGroupBy?: string;
  tabBy?: string;
  tabs?: unknown[];
  readonly trashedAt?: number | null;
  readonly trashedBy?: string | null;
  readonly updatedAt?: number | null;
  readonly updatedBy?: string | null;
  readonly visibility?: string | null;
}

export interface CollectionProperties {
  collectionId: string;
  propertyId: string;
  sortOrder: number;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
}

export interface CollectionViews {
  collectionId: string;
  viewId: string;
  sortOrder: number;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
}

export interface CollectionItems {
  itemId: string;
  fromResource: string;
  collectionId: string;
  location: string;
  sortOrder: number;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
}

export interface RecordLinks {
  in: string;
  fromResource: string;
  out: string;
  toResource: string;
  linkType: string;
  location: string;
  tags: unknown;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
}

export interface PropertyValues {
  itemId: string;
  fromResource: string;
  propertyId: string;
  collectionId: string;
  value: unknown;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
}

export interface SpaceItems {
  spaceId: string;
  itemId: string;
  toResource: string;
  description: string;
  itemType: string;
  label: string;
  parentId: string;
  sortOrder: number;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
}

export interface SessionItems {
  sessionId: string;
  itemId: string;
  toResource: string;
  blocks: unknown;
  parentObjectiveId: string;
  sortOrder: number;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
}

export interface Tables {
  accessLog: AccessLog;
  capture: Capture;
  collection: Collection;
  event: Event;
  file: File;
  linkTag: LinkTag;
  node: Node;
  objective: Objective;
  property: Property;
  publicLink: PublicLink;
  session: Session;
  sessionLog: SessionLog;
  space: Space;
  task: Task;
  vector: Vector;
  view: View;
  collection_properties: CollectionProperties;
  collection_views: CollectionViews;
  collection_items: CollectionItems;
  record_links: RecordLinks;
  property_values: PropertyValues;
  space_items: SpaceItems;
  session_items: SessionItems;
}

export type TypedClient = DatafnClient & {
  accessLog: DatafnTable<AccessLog>;
  capture: DatafnTable<Capture>;
  collection: DatafnTable<Collection>;
  event: DatafnTable<Event>;
  file: DatafnTable<File>;
  linkTag: DatafnTable<LinkTag>;
  node: DatafnTable<Node>;
  objective: DatafnTable<Objective>;
  property: DatafnTable<Property>;
  publicLink: DatafnTable<PublicLink>;
  session: DatafnTable<Session>;
  sessionLog: DatafnTable<SessionLog>;
  space: DatafnTable<Space>;
  task: DatafnTable<Task>;
  vector: DatafnTable<Vector>;
  view: DatafnTable<View>;
};
