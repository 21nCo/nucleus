import { Agent } from "../../account/account.type";
import {
  resolveInsertQuery,
  resolveMutationQueryV2
} from "$lib/shared/utils/surreal.utils";
import {
  ICloneDownBody,
  ICloneDownPaginateBody,
  ICloneUpBody,
  ISyncDownBody,
  ISyncUpBody,
  SyncMethod
} from "@nucleum/schema/legacy/sync.type";
import { performQueryOnBehalfOfUser } from "../../user/user";
import {
  resolveCountQuery,
  resolveSyncDownQuery,
  resolveCloneDownQuery,
  resolveCloneDownPaginateQuery
} from "./sync.utils";

/**
 * Syncs the user data from clients to the database
 * @param body
 * @param method
 * @returns
 */
export async function syncV2(
  body:
    | ISyncUpBody
    | ISyncDownBody
    | ICloneUpBody
    | ICloneDownBody
    | ICloneDownPaginateBody,
  agent: Agent,
  method: SyncMethod
) {
  console.log({ at: "syncV2", body, agent, method });
  try {
    let result;
    switch (method) {
      case SyncMethod.SYNC_UP:
        result = await syncUp(body as ISyncUpBody, agent);
        break;
      case SyncMethod.SYNC_DOWN:
        result = await syncDown(body as ISyncDownBody, agent);
        break;
      case SyncMethod.CLONE_UP:
        result = await cloneUp(body as ICloneUpBody, agent);
        break;
      case SyncMethod.CLONE_DOWN:
        result = await cloneDown(body as ICloneDownBody, agent);
        break;
      case SyncMethod.CLONE_DOWN_PAGINATE:
        result = await cloneDownPaginate(body as ICloneDownPaginateBody, agent);
        break;
      default:
        return { error: "Invalid sync method" };
    }
    return result;
  } catch (e) {
    console.error({ at: "syncV2 - error", error: e });
    return { error: "Sync failed" };
  }
}

export async function syncUp(body: ISyncUpBody, agent: Agent) {
  try {
    const { mutations, lastSyncDown, resources, dapId } = body;
    if (!mutations || !Array.isArray(mutations) || mutations.length < 1) {
      return { error: "No mutations to sync" };
    }
    const fetchBackQuery = resolveSyncDownQuery(lastSyncDown, resources, dapId);
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

export async function syncDown(body: ISyncDownBody, agent: Agent) {
  try {
    const { lastSyncDown, resources, dapId } = body;
    if (!resources || resources?.length < 1)
      return { error: "No resources found" };
    const fetchBackQuery = resolveSyncDownQuery(lastSyncDown, resources, dapId);
    const countQuery = resolveCountQuery(resources);
    const fullQuery = `${fetchBackQuery}; ${countQuery};`;
    if (!fullQuery) return { error: "transaction failed" };
    const response = await performQueryOnBehalfOfUser(fullQuery, agent);
    return response;
  } catch (e) {
    console.error({ at: "syncDown - error", error: e });
    return { error: "Sync failed" };
  }
}

export async function cloneUp(body: ICloneUpBody, agent: Agent) {
  try {
    const { resource, records } = body;
    const query = resolveInsertQuery(resource, records);
    const response = await performQueryOnBehalfOfUser(query, agent);
    return response;
  } catch (e) {
    console.error({ at: "cloneUp - error", error: e });
    return { error: "Sync failed" };
  }
}

export async function cloneDown(body: ICloneDownBody, agent: Agent) {
  try {
    const { resources, isExtension } = body;
    if (resources?.length < 1) return { error: "No resources found" };
    const limit = body.limit || 500;
    const query = resolveCloneDownQuery(resources, {
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

/**
 * TODO - Implement streaming or download via S3 if too many records - as AWS Lambda has a limit of 6MB for response size
 * @param body
 * @param agent
 * @returns
 */
export async function cloneDownPaginate(
  body: ICloneDownPaginateBody,
  agent: Agent
) {
  try {
    const { resource, offset, limit, isExtension } = body;
    const query = resolveCloneDownPaginateQuery(resource, {
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
