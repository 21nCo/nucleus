import { Resource } from "@nucleum/datafn/resource.enum";
import { IRecordId, IResourceSelectParams } from "$lib/client/types/data.type";
import { Agent } from "$lib/server/common/account/account.type";
import {
  ISyncUpBody,
  ISyncDownBody,
  ICloneUpBody,
  ICloneDownBody,
  ICloneDownPaginateBody,
  IReconcileBody,
  ICloneDownPaginatev2Body
} from "$lib/shared/types/sync.type";

export enum SyncProvider {
  SURREAL = "surreal",
  DYNAMODB = "dynamodb"
}

export interface ISyncProviderConfig {
  provider: SyncProvider;
}

export interface ISyncProvider {
  name: SyncProvider;
  // Core sync operations
  syncUp(body: ISyncUpBody, agent: Agent): Promise<any>;
  syncDown(body: ISyncDownBody, agent: Agent): Promise<any>;

  // Clone operations
  cloneUp(body: ICloneUpBody, agent: Agent): Promise<any>;
  cloneDown(body: ICloneDownBody, agent: Agent): Promise<any>;
  cloneDownv2(body: ICloneDownBody, agent: Agent): Promise<any>;

  // Pagination
  paginate(body: ICloneDownPaginateBody, agent: Agent): Promise<any>;
  paginatev2(body: ICloneDownPaginatev2Body, agent: Agent): Promise<any>;

  // Reconciliation
  reconcile(body: IReconcileBody, agent: Agent): Promise<any>;

  selectMany(
    agent: Agent,
    resource: Resource,
    params?: IResourceSelectParams
  ): Promise<any>;

  select(
    agent: Agent,
    resourceId: IRecordId,
    properties?: string[]
  ): Promise<any>;

  deleteUser(agent: Agent): Promise<any>;
}
