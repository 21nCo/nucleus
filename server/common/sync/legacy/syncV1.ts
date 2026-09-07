import { Resource } from "@nucleum/datafn/resource.enum";
import { Agent } from "$lib/server/common/account/account.type";
import { SyncMethod } from "$lib/shared/types/sync.type";
import {
  resolveInsertQuery,
  resolveMutationQueryV2
} from "$lib/shared/utils/surreal.utils";
import { performQueryOnBehalfOfUser } from "../../user/user";

/**
 * Syncs the user data from clients to the database
 * @param body
 * @param method
 * @returns
 */
export async function handleSyncV1(body: any, agent: Agent, method: string) {
  console.log({ at: "sync", body, agent, method });
  try {
    const result = await _processSync(body, agent, method);
    console.log({ at: "sync - result", result, body, method });
    return result;
  } catch (e) {
    console.error({ at: "sync - error", error: e });
    return { error: "Sync failed" };
  }
}

/**
 *
 */
async function _processSync(body: any, agent: Agent, method: string) {
  if (method === SyncMethod.SYNC_UP) {
    const { mutations, lastSyncDown, resources, dapId } = body;
    if (!mutations || !Array.isArray(mutations) || mutations.length < 1) {
      return { error: "No mutations to sync" };
    }
    const fetchBackQuery = resolveSyncDownQuery(lastSyncDown, resources, dapId);
    let response;
    if (
      mutations.every(
        (mutation: any) =>
          !mutation.resourceId ||
          typeof mutation.resourceId === "string" ||
          (Array.isArray(mutation.resourceId) &&
            mutation.resourceId.length < 50)
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
      }
      const fetchBackResponse = await performQueryOnBehalfOfUser(
        fetchBackQuery,
        agent
      );
      mutationResponses.push(...fetchBackResponse);
      response = mutationResponses;
    }
    console.log({ method, response });
    if (response) return response;
    else return { error: "transaction failed" };
  } else if (method === SyncMethod.SYNC_DOWN) {
    const { lastSyncDown, resources, dapId } = body;
    const fetchBackQuery = resolveSyncDownQuery(lastSyncDown, resources, dapId);
    const countQuery = resolveCountQuery(resources);
    const fullQuery = `${fetchBackQuery}; ${countQuery};`;
    if (!fullQuery) return { error: "transaction failed" };
    const response = await performQueryOnBehalfOfUser(fullQuery, agent);
    return response;
  } else if (method === SyncMethod.CLONE_UP) {
    const { resource, records } = body;
    const query = resolveInsertQuery(resource, records);
    const response = await performQueryOnBehalfOfUser(query, agent);
    return response;
  } else if (method === SyncMethod.CLONE_DOWN) {
    const { resources, isExtension } = body;
    let query = "";
    if (resources?.length < 1) return { error: "No resources found" };
    if (!isExtension) {
      resources.forEach((resource) => {
        query += `select *, meta::id(id) as id from ${resource};`;
      });
    } else {
      resources.forEach((resource) => {
        query += `select * from ${resource};`;
      });
    }
    const response = await performQueryOnBehalfOfUser(query, agent);
    return response;
  } else {
    return { error: "Unknown sync method" };
  }

  function resolveSyncDownQuery(
    lastSyncDown: number,
    resources: Resource[],
    dapId: string
  ) {
    console.log({ at: "resolveSyncDownQuery", lastSyncDown, resources });
    return `SELECT * FROM mutation WHERE timestamp > ${lastSyncDown} AND dapId IS NOT '${dapId}' AND resource IN [${resources
      .map((x) => `'${x}'`)
      .join(",")}] ORDER BY timestamp ASC;`;
  }

  function resolveCountQuery(resources: Resource[]) {
    let query = "";
    for (const resource of resources) {
      query += `array::first(select count() as ${resource} from ${resource} group all);`;
    }
    return query;
  }
}
