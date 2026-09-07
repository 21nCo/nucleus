import type { Writable } from "svelte/store";
import type { ResourceActionType } from "@nucleum/datafn/resource.type";
import type { Resource } from "@nucleum/datafn/resource.enum";

/**
 * The operations which can be performed on a cacheable store
 */
export interface IObservableStore<T> extends IStore, Writable<T> {}

/**
 * Extensible interface for the store
 */
export interface IStore {
  /**
   * The unique identifier of the store which is used to cache and retrieve the store.
   */
  id: string;
  /**
   * The type of data the store holds
   */
  dataType: StoreDataType;

  /**
   * @deprecated - use tables config to determine if the store is cloud only
   * Whether the resource is cloud only. If true, mutations or select queries will be directly relayed to the cloud and not saved locally
   */
  isCloudOnlyResource?: boolean;

  /**
   * The data in the store
   * @returns the data in the store
   */
  get: () => any;

  /**
   * Prevents the store from being persisted to remote database when the store is updated using $ syntax and therefore set method
   */
  isPreventAutoPersist?: boolean;

  loader?: (data: any) => void;
  search?: (query: string) => any;
}

export interface IResourceStore<T> extends IStore, Writable<T[]> {
  /**
   * @deprecated - use tables config instead
   * The indices to be created on the database for the store
   *
   * Follows dexie.js format
   * simple index: "id", "text" etc
   * compound index: "[isArchived+isStarred]"
   */
  indices?: string[];

  /**
   * @deprecated - use tables config instead
   * The fields to be indexed by FlexSearch for full-text search
   * These fields will be extracted and indexed for search operations
   * Example: ["label", "text", "body"] for searchable text fields
   */
  searchIndices?: string[];

  /**
   * The default properties to be set on the resource when it is created
   */
  defaultProps?: Partial<T>;

  /**
   * Properties to be expanded by default when expand is set to true
   */
  expandProps?: string[];
  /**
   * @deprecated - use tables config instead
   * Properties to be encrypted
   */
  encrypt?: string[];
}

/**
 * The type of data the store holds
 */
export enum StoreDataType {
  /**
   * Finite and infrequently mutated Records
   */
  FIR = "FIR",
  /**
   *
   * Infinite and frequently mutated Records
   */
  IFR = "IFR",
  /**
   * @deprecated
   * Finite and Constant system Records
   */
  FCR = "FCR",
  /**
   * Key Value Object - cached and persisted to remote database
   */
  KVO = "KVO",
  /**
   * Not Applicable - Non persisting Client store for UI state management
   */
  NA = "NA"
}

export enum PersistenceActionType {
  CREATE = "CREATE",
  /**
   * Inserts the new record(s) using upsert strategy.
   */
  INSERT = "INSERT",
  /**
   * Replaces the existing record with the new data
   */
  REPLACE = "REPLACE",
  /**
   * Merges the existing record properties with the provided properties
   */
  MERGE = "MERGE",
  /**
   * Deletes the record.
   *
   * Note: Use this to completely delete the record. To move to trash, use MERGE with trashedAt.
   */
  DELETE = "DELETE",
  /**
   * Deletes the records.
   */
  BULK_DELETE = "BULK_DELETE",
  BULK_MERGE = "BULK_MERGE",
  /**
   * Inserts the new records without upsert.
   */
  BULK_INSERT = "BULK_INSERT",
  CUSTOM = "CUSTOM"
}

export type IInsertMutation<T> = {
  action: PersistenceActionType.INSERT | PersistenceActionType.BULK_INSERT;
  records: T[];
  isSkipFlexSearchIndexing?: boolean;
};

export type IReplaceMutation<T> = {
  action: PersistenceActionType.REPLACE;
  record: T;
};

export type IMergeMutation<T> = {
  action: PersistenceActionType.MERGE;
  record: Partial<T>;
};

export type IDeleteMutation = {
  action: PersistenceActionType.DELETE;
  recordId: IRecordId;
};

export type IBulkEditMutation<T> = {
  action: PersistenceActionType.BULK_MERGE;
  /**
   * @deprecated - use ids and properties instead
   */
  records?: T[];
  recordIds: IRecordId[];
  changes: Partial<T>;
};

export type IBulkDeleteMutation = {
  action: PersistenceActionType.BULK_DELETE;
  recordIds: IRecordId[];
};

export type ICustomMutationParams = {
  action: PersistenceActionType.CUSTOM;
  query: string;
  data?: any;
};

export type IMutationParamsv2<T> =
  | IInsertMutation<T>
  | IReplaceMutation<T>
  | IMergeMutation<T>
  | IDeleteMutation
  | IBulkEditMutation<T>
  | IBulkDeleteMutation
  | ICustomMutationParams;

export type IPrimitiveDbDataType = string | number | boolean | Date | IRecordId;

export type IResourceFilterValue =
  | IPrimitiveDbDataType
  | undefined
  | IPrimitiveDbDataType[]
  | {
      greaterThan?: IPrimitiveDbDataType;
      lessThan?: IPrimitiveDbDataType;
      greaterThanOrEqual?: IPrimitiveDbDataType;
      lessThanOrEqual?: IPrimitiveDbDataType;
      notIn?: IPrimitiveDbDataType[];
      contains?: IPrimitiveDbDataType;
      notEquals?: IPrimitiveDbDataType;
    };

export enum IResourceFilterOperator {
  EQUALS = "equals",
  NOT_EQUALS = "notEquals",
  GREATER_THAN = "greaterThan",
  GREATER_THAN_OR_EQUALS = "greaterThanOrEqual",
  LESS_THAN = "lessThan",
  LESS_THAN_OR_EQUALS = "lessThanOrEqual",
  IN = "in",
  NOT_IN = "notIn",
  CONTAINS = "contains"
}

export enum IResourceFilterDateGrouping {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year"
}

export type IResourceSelectOrderBy = {
  [key: string]: "asc" | "desc";
};

export enum ResourceFilterCondition {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  GREATER_THAN = "GREATER_THAN",
  GREATER_THAN_OR_EQUALS = "GREATER_THAN_OR_EQUALS",
  LESS_THAN = "LESS_THAN",
  LESS_THAN_OR_EQUALS = "LESS_THAN_OR_EQUALS",
  IN = "IN",
  NOT_IN = "NOT_IN",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  STARTS_WITH = "STARTS_WITH",
  ENDS_WITH = "ENDS_WITH",
  IS_NULL = "IS_NULL",
  IS_NOT_NULL = "IS_NOT_NULL"
}

export type IResourceFilter = {
  property: string;
  value: IResourceFilterValue;
  condition: ResourceFilterCondition;
};

export enum FilterCombinationMethod {
  AND = "AND",
  OR = "OR"
}

export type IResourceFilterGroup = {
  filters: (IResourceFilter | IResourceFilterGroup)[];
  condition: FilterCombinationMethod;
};

export type IResourceSelectFilters = {
  [key: string]: IResourceFilterValue;
};

export enum SearchType {
  FULL_TEXT = "FULL_TEXT",
  SEMANTIC = "SEMANTIC"
}

export type IResourceSearch = {
  query: string;
  queryEmbedding?: Float32Array[];
  properties?: string[];
  isCaseSensitive?: boolean;
  type?: SearchType;
};

export type IResourceSelectProperties = {
  /**
   * Properties to be selected, that is items to be present in select statement.
   * Eg: SELECT properties[0], properties[1], properties[2] FROM table;
   *
   * Use "#" for count()
   */
  select?: string[];

  /**
   * Properties that needs to be expanded.
   */
  expand?: string[];

  /**
   * Properties that needs to be recursively expanded. Only to be used with .select() and doesnot work with selectMany()
   *
   * Ex: children.*.chidren
   */
  recurse?: string;
  /**
   * The fields to be omitted.
   */
  omit?: string[];
};

export type IResourceSelectParams = {
  properties?: IResourceSelectProperties;
  /**
   * @deprecated - use search.type instead
   * Should the searh be semantic or full text.
   */
  searchType?: SearchType;
  /**
   * @deprecated - use limit instead
   * Number of top matches to be retireved for semantic search.
   */
  semanticSearchTopK?: number;

  /**
   * Filters to be applied on the resources.
   *
   * Use filterGroup instead to combine multiple filters using AND or OR condition in cases of user facing filters. For rest of the application system cases, basic filters in combination with search can be used.
   *
   */
  filters?: IResourceSelectFilters;

  filterGroup?: IResourceFilterGroup;

  /**
   * Search to be applied on the resources.
   * Provided properties will be combined using `OR` condition.
   *
   * Note: This uses search index and search index should have been defined on the database provider.
   *
   */
  search?: IResourceSearch;
  /**
   * @deprecated - use filters instead
   * Use only if filters doesn't cover the use case.
   */
  whereClause?: string | string[];
  /**
   * The number of records to be returned.
   */
  limit?: number;
  /**
   * The number of records to be skipped.
   */
  offset?: number;
  /**
   * The fields to be grouped by.
   */
  groupBy?: string[];
  /**
   * The fields to be ordered by.
   */
  orderBy?: IResourceSelectOrderBy;
};

export type IRecordId = string;

export type IMutation = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  timestamp: number;
  /**
   * @deprecated - storing dapId on kv:local
   */
  dapId?: string;
  userId: string;
  resource: string;
  resourceId?: IRecordId | IRecordId[];
  action: ResourceActionType;
  params: IMutationParamsv2<any>;
};

export type IMutationAdditionalParams = {
  /**
   * Whether the mutation should prevent local resource subscriptions
   */
  isPreventSubscriptions?: boolean;
  /**
   * The context of the mutation like accessPoint etc.
   */
  context?: string;
  /**
   * Whether the mutation should prevent cloud persistence - will be saved locally if true.
   */
  isPreventCloudPersistence?: boolean;
};

export type IResourceSelectAdditionalParams = {
  /**
   * Whether to use cloud to select. Local will be used if not provided.
   */
  isUseCloud?: boolean;

  /**
   * Whether to include inactive items i.e. archived and trashed items.
   */
  isIncludeInactiveItems?: boolean;
  /**
   * Whether to ignore parent inactive status of the resource.
   */
  isIgnoreParentInactive?: boolean;

  /**
   * Whether to include meta items of the resource.
   */
  isIncludeMetaItems?: boolean;

  /**
   * When this is set to true, the query will be executed as is without any filter editing by the resource store.
   */
  isQueryAsIs?: boolean;
  /**
   * AbortSignal to cancel the operation when the component unmounts
   */
  signal?: AbortSignal;
};

export enum RemovalProperty {
  IS_ARCHIVED = "isArchived",
  TRASHED_AT = "trashedAt"
}
