import { Agent } from "$lib/server/common/account/account.type";
import { Resource } from "@nucleum/schema/resource.enum";
import {
  ISyncUpBody,
  ISyncDownBody,
  ICloneUpBody,
  ICloneDownBody,
  ICloneDownPaginateBody,
  IReconcileBody,
  ICloneDownPaginatev2Body
} from "@nucleum/schema/legacy/sync.type";
import {
  IMutation,
  IRecordId,
  IResourceSelectParams
} from "@nucleum/schema/legacy/data.type";
import { ISyncProvider, SyncProvider } from "./types";
import { performQueryOnBehalfOfUser } from "../../user/user";
import {
  resolveMutationQueryV2,
  resolveInsertQuery as surrealResolveInsertQuery,
  commonQueryReplacements,
  resolveSelectManyQuery,
  resolveSelectQuery
} from "$lib/shared/utils/surreal.utils";

export class SurrealSyncProvider implements ISyncProvider {
  name: SyncProvider = SyncProvider.SURREAL;

  selectMany(agent: Agent, resource: Resource, params?: IResourceSelectParams) {
    const query = resolveSelectManyQuery(resource, params);
    return performQueryOnBehalfOfUser(query, agent);
  }

  select(agent: Agent, resourceId: IRecordId, properties?: string[]) {
    const query = resolveSelectQuery(resourceId, properties);
    return performQueryOnBehalfOfUser(query, agent);
  }

  cloneDownv2(body: ICloneDownBody, agent: Agent): Promise<any> {
    throw new Error("Method not implemented.");
  }
  paginatev2(body: ICloneDownPaginatev2Body, agent: Agent): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async deleteUser(agent: Agent): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async syncUp(body: ISyncUpBody, agent: Agent): Promise<any> {
    try {
      const { mutations, lastSyncDown, resources, dapId } = body;
      if (!mutations || !Array.isArray(mutations) || mutations.length < 1) {
        return { error: "No mutations to sync" };
      }
      const fetchBackQuery = this.resolveSyncDownQueryV4(
        lastSyncDown,
        resources,
        dapId
      );
      let response;
      if (
        mutations.length < 20 &&
        mutations.every(
          (mutation: any) =>
            !mutation.resourceId ||
            typeof mutation.resourceId === "string" ||
            (Array.isArray(mutation.resourceId) &&
              mutation.resourceId.length < 20)
        )
      ) {
        const insertMutationsQuery = `INSERT INTO mutation ${JSON.stringify(
          mutations
        )};`;
        const individualMutationsQuery = mutations
          .map((mutation: any) => resolveMutationQueryV2(mutation))
          .join("; ");
        const masterQuery = `${insertMutationsQuery}; ${individualMutationsQuery}; ${fetchBackQuery};`;
        response = await performQueryOnBehalfOfUser(masterQuery, agent);
      } else {
        console.log({ at: "sync - large mutations found" });
        let mutationResponses = [];
        for (const mutation of mutations) {
          try {
            const insertMutationQuery = `INSERT INTO mutation [${JSON.stringify(
              mutation
            )}];`;
            const mutationInsertResponse = await performQueryOnBehalfOfUser(
              insertMutationQuery,
              agent
            );
            const mutationQuery = resolveMutationQueryV2(mutation);
            const individualMutationResponse = await performQueryOnBehalfOfUser(
              mutationQuery,
              agent
            );
            if (Array.isArray(individualMutationResponse)) {
              mutationResponses.push(...individualMutationResponse);
            } else {
              mutationResponses.push(individualMutationResponse);
            }
          } catch (e) {
            console.error({ at: "syncUp - error", error: e });
            mutationResponses.push({ error: "Sync failed" });
          }
        }
        const fetchBackResponse = await performQueryOnBehalfOfUser(
          fetchBackQuery,
          agent
        );
        mutationResponses.push(...fetchBackResponse);
        response = mutationResponses;
      }
      if (response) return response;
      else return { error: "transaction failed" };
    } catch (e) {
      console.error({ at: "syncUp - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async syncDown(body: ISyncDownBody, agent: Agent): Promise<any> {
    try {
      const { lastSyncDown, resources, dapId } = body;
      if (!resources || resources?.length < 1)
        return { error: "No resources found" };
      const fetchBackQuery = this.resolveSyncDownQueryV4(
        lastSyncDown,
        resources,
        dapId
      );
      const countQuery = this.resolveCountQuery(resources);
      const fullQuery = `${fetchBackQuery}; ${countQuery};`;
      if (!fullQuery) return { error: "transaction failed" };
      const response = await performQueryOnBehalfOfUser(fullQuery, agent);
      return response;
    } catch (e) {
      console.error({ at: "syncDown - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async cloneUp(body: ICloneUpBody, agent: Agent): Promise<any> {
    try {
      const { resource, records } = body;
      const query = this.resolveInsertQuery(resource, records);
      const response = await performQueryOnBehalfOfUser(query, agent);
      return response;
    } catch (e) {
      console.error({ at: "cloneUp - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async cloneDown(body: ICloneDownBody, agent: Agent): Promise<any> {
    try {
      const { resources, isExtension } = body;
      if (resources?.length < 1) return { error: "No resources found" };
      const limit = body.limit || 500;
      const query = this.resolveCloneDownQuery(resources, {
        isExtension,
        limit
      });
      const response = await performQueryOnBehalfOfUser(query, agent);
      return response;
    } catch (e) {
      console.error({ at: "cloneDown - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async paginate(body: ICloneDownPaginateBody, agent: Agent): Promise<any> {
    try {
      const { resource, offset, limit, isExtension } = body;
      const query = this.resolveCloneDownPaginateQuery(resource, {
        offset,
        limit,
        isExtension
      });
      const response = await performQueryOnBehalfOfUser(query, agent);
      return response;
    } catch (e) {
      console.error({ at: "cloneDownPaginate - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async reconcile(body: IReconcileBody, agent: Agent): Promise<any> {
    try {
      const { resources } = body;
      for (const resource of resources) {
        switch (resource) {
          case Resource.node:
            await this.runReconciliationForNodeResource(agent);
            break;
        }
      }
      return { success: true };
    } catch (e) {
      console.error({ at: "reconcile - error", error: e });
      return { error: "Sync failed" };
    }
  }

  private async runReconciliationForNodeResource(agent: Agent) {
    try {
      const query = "select value id from node where contentType is NONE";
      const response = await performQueryOnBehalfOfUser(query, agent);
      if (
        response &&
        Array.isArray(response) &&
        response.length > 0 &&
        response[0].result
      ) {
        const badData = response[0].result;
        const deleteQuery = commonQueryReplacements(
          `DELETE FROM node where id in ${JSON.stringify(badData)}`
        );
        const deleteResponse = await performQueryOnBehalfOfUser(
          deleteQuery,
          agent
        );
      }
    } catch (e) {
      console.error({ at: "reconcile - node - error", error: e });
      return { error: "Sync failed" };
    }
  }

  resolveSyncDownQuery(
    lastSyncDown: number,
    resources: Resource[],
    dapId: string,
    limit?: number
  ): string {
    const syncDownLimit = limit || 100;
    const resourceList = resources.map((x) => `'${x}'`).join(",");
    return `BEGIN TRANSACTION; let $count = array::first(SELECT count() FROM mutation WHERE timestamp > ${lastSyncDown} AND dapId IS NOT '${dapId}' AND resource IN [${resourceList}] group all); RETURN IF $count.count < ${syncDownLimit} THEN SELECT * FROM mutation WHERE timestamp > ${lastSyncDown} AND dapId IS NOT '${dapId}' AND resource IN [${resourceList}] ORDER BY timestamp ASC ELSE $count.count END; COMMIT TRANSACTION;`;
  }

  resolveSyncDownQueryV4(
    lastSyncDown: number,
    resources: Resource[],
    dapId: string
  ): string {
    const resourceList = resources.map((x) => `'${x}'`).join(",");
    return `BEGIN TRANSACTION; let $mutations = SELECT resourceId, timestamp,action, resource FROM mutation WHERE timestamp > ${lastSyncDown} AND dapId IS NOT '${dapId}' AND resource IN [${resourceList}] AND resourceId IS NOT NONE AND resourceId IS NOT '$NONE' ORDER BY timestamp DESC; let $latestTimestamp = return array::first($mutations); let $records = select * from array::distinct(array::flatten(select value rec from (select if type::is::array(resourceId) then resourceId.map(|$v| type::record($v)); else [type::record(resourceId)] end as rec from $mutations where action is not 'delete'))); let $deleted = select * from $mutations where action is 'delete'; return {latestTimestamp: $latestTimestamp, records: $records, deleted: $deleted }; COMMIT TRANSACTION;`;
  }

  resolveCountQuery(resources: Resource[]): string {
    let query = "";
    for (const resource of resources) {
      query += `array::first(select count() as ${resource} from ${resource} group all);`;
    }
    return query;
  }

  resolveCloneDownQuery(
    resources: Resource[],
    params?: {
      isExtension?: boolean;
      limit?: number;
    }
  ): string {
    const cloneDownLimit = params?.limit || 500;
    let query = "";
    if (!params?.isExtension) {
      resources.forEach((resource) => {
        query += `select *, meta::id(id) as id from ${resource} LIMIT ${cloneDownLimit};`;
      });
    } else {
      resources.forEach((resource) => {
        query += `select * from ${resource} LIMIT ${cloneDownLimit};`;
      });
    }
    return query;
  }

  resolveCloneDownPaginateQuery(
    resource: Resource,
    params: {
      offset: number;
      limit: number;
      isExtension: boolean;
    }
  ): string {
    const { offset, limit, isExtension } = params;
    if (!isExtension) {
      return `select *, meta::id(id) as id from ${resource} LIMIT ${limit} START ${offset};`;
    }
    return `select * from ${resource} LIMIT ${limit} START ${offset};`;
  }

  resolveMutationQuery(mutation: IMutation): string {
    return resolveMutationQueryV2(mutation);
  }

  resolveInsertQuery(resource: Resource, records: any[]): string {
    return surrealResolveInsertQuery(resource, records);
  }
}
