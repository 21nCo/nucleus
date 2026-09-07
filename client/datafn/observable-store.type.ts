import { type StoreDataType } from "@nucleum/schema/legacy/store-data-type.enum";

import type { Writable } from "svelte/store";

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
