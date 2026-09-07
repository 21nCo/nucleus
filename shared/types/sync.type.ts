import { Resource } from "@nucleum/datafn/resource.enum";
import type { IMutation } from "@21n/types/data.type";

export enum SyncMethod {
  SYNC_UP = "up",
  SYNC_DOWN = "down",
  CLONE_UP = "cloneup",
  CLONE_DOWN = "clonedown",
  CLONE_DOWN_V2 = "clonedownv2",
  CLONE_DOWN_PAGINATE = "paginate",
  CLONE_DOWN_PAGINATE_V2 = "paginatev2",
  RECONCILE = "reconcile"
}

export type ISyncUpBody = {
  mutations: IMutation[];
  lastSyncDown: number;
  resources: Resource[];
  dapId: string;
};

export type ISyncDownBody = {
  lastSyncDown: number;
  resources: Resource[];
  dapId: string;
  isReturnCount?: boolean;
};

export type ICloneUpBody = {
  resource: Resource;
  records: any[];
};

export type ICloneDownBody = {
  resources: Resource[];
  limit?: number;
  isExtension: boolean;
};

export type ICloneDownPaginateBody = {
  resource: Resource;
  isExtension: boolean;
  offset: number;
  limit: number;
  cursor?: string;
};

export type ICloneDownPaginatev2Body = {
  resource: Resource;
  isExtension: boolean;
  cursor?: string;
};

export type IReconcileBody = {
  resources: Resource[];
  isExtension?: boolean;
};
