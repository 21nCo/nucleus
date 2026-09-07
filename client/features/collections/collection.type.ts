import type {
  IActiveResource,
  IResource,
  IResourceArchivable,
  IResourceLabeled,
  IResourceStarrable,
  IResourceShareable,
  IResourceImportable
} from "@nucleum/datafn/resource.type";
import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { Arrangement, Placement } from "@21n/elements/direction.enum";
import type { INodeThumb } from "@nucleum/features/memory/node/node.type";
import type {
  IProperty,
  IPropertyValue
} from "@nucleum/features/collections/properties/property.type";
import type { Resource } from "@nucleum/datafn/resource.enum";
import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";

export enum CollectionType {
  /**
   * All collection will have the ability for properties, templates etc. Therefore the older version "TYPED" collection is deprecated and is now "DEFAULT"
   */
  TYPED = "TYPED",
  /**
   * @deprecated
   */
  UNTYPED = "UNTYPED",
  QUERY = "QUERY",
  SYNCED = "SYNCED"
}

export enum CollectionLayout {
  BOARD = "BOARD",
  TABLE = "TABLE",
  CALENDAR = "CALENDAR",
  MAP = "MAP"
}

export enum CollectionObjectKey {
  typeToExtend = "typeToExtend",
  isCaptureShortcutEnabled = "isCaptureShortcutEnabled"
}

export type ICoverLayout = {
  placement?: Placement.Left | Placement.Top | Placement.Right;
  position?: {
    x?: number;
    y?: number;
  };
  size?: {
    width?: number;
    height?: number;
  };
};

interface ICollectionBase extends IResourceLabeled, IResourceImportable {
  type?: CollectionType;
  resource?: Resource;
  cover?: string;
  coverLayout?: ICoverLayout;
  description?: string;
  isStarred?: boolean;
  [CollectionObjectKey.isCaptureShortcutEnabled]?: boolean;
  query?: string;
  avatar?: IAvatar;
}

type IResourcePropertiesForCollection = IResource &
  IResourceShareable &
  IResourceStarrable &
  IResourceArchivable;

export interface ICollection
  extends ICollectionBase, IResourcePropertiesForCollection {
  type: CollectionType;
  resource: Resource;
  /**
   * Type collection to extend - string identifier ex: collection:sometypecollection
   */
  [CollectionObjectKey.typeToExtend]: IRecordId | null;
  properties?: IRecordId[];
  views: IRecordId[];
}

export interface ICollectionCapture extends ICollectionBase {
  defaultLayout?: CollectionLayout;
  views?: IRecordId[];
  properties?: IRecordId[];
  typeToExtend?: IRecordId | null;
}

export type ICollectionThumb = ICollectionBase &
  IResourcePropertiesForCollection & {
    type: CollectionType;
    resource: Resource;
    typeToExtend?: ICollection | null;
    properties?: IRecordId[];
    views: IRecordId[];
  };

export interface ICollectionExpanded
  extends ICollectionBase, IResourcePropertiesForCollection {
  type: CollectionType;
  resource: Resource;
  properties?: IProperty[];
  [CollectionObjectKey.typeToExtend]?: ICollectionExpanded | null;
  extendProperties?: IProperty[];
}

export type IActiveCollection = IActiveResource &
  ICollectionExpanded & {
    isPageLoading: boolean;
    totalItemCount: number;
    views: ICollectionViewWithData[];
  };

export type ICollectionViewWithData = ICollectionView & {
  data: INodeThumb[];
};

export type ICollectionViewBase = IResourceLabeled & IResourceImportable;

export type ICollectionViewCapture = ICollectionViewBase & {
  id?: IRecordId;
  layout?: CollectionLayout;
};

type IResourcePropertiesForCollectionView = IResource & IResourceShareable;

export type ICollectionView = ICollectionViewBase &
  IResourcePropertiesForCollectionView &
  ICollectionViewArrangementConfig & {
    /**
     * Layout for the view.
     */
    layout: CollectionLayout;
    /**
     * Property id to show as tabs.
     * "none" for no tabs.
     */
    tabBy: string;
    /**
     * Property id to group by.
     * "none" for no grouping.
     */
    groupBy: string;
    /**
     * Property id to sub group by.
     * "none" for no sub grouping.
     */
    subGroupBy: string;
    /**
     * Configured tabs for non select type property.
     *
     * Ex: datetime, location or text property with criteria etc
     */
    tabs?: any[];
    /**
     * Configured properties to show in the view.
     */
    properties?: IRecordId[];
  };

export interface ICollectionViewArrangementConfig {
  arrangement?: Arrangement;
  /**
   * Hides previews for thumbnails of nodes in a collection view if enabled.
   */
  isHideThumbnailPreview?: boolean;
  /**
   * Hides title for thumbnails of nodes in a collection view if enabled. Currently only used for Masonry arrangement.
   */
  isHideThumbnailTitle?: boolean;
  density?: number;
}

export type ICollectionItem = INodeThumb | IObjectiveThumb;

export type ICollectionItemPropertyValue = {
  id: IRecordId;
  value: IPropertyValue | null;
  collectionId?: IRecordId;
};

export type ICollectionCountStore = {
  counts: {
    [key: string]: number;
  };
  isInitialized: boolean;
};

export interface ICollectible {
  propertyValues?: ICollectionItemPropertyValue[];
  collections?: IRecordId[];
}
