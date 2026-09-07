import { Resource } from "@nucleum/schema/resource.enum";

export function resolveSyncDownQuery(
  lastSyncDown: number,
  resources: Resource[],
  dapId: string,
  limit?: number
) {
  const syncDownLimit = limit || 100;
  const resourceList = resources.map((x) => `'${x}'`).join(",");
  return `BEGIN TRANSACTION; let $count = array::first(SELECT count() FROM mutation WHERE timestamp > ${lastSyncDown} AND dapId IS NOT '${dapId}' AND resource IN [${resourceList}] group all); RETURN IF $count.count < ${syncDownLimit} THEN SELECT * FROM mutation WHERE timestamp > ${lastSyncDown} AND dapId IS NOT '${dapId}' AND resource IN [${resourceList}] ORDER BY timestamp ASC ELSE $count.count END; COMMIT TRANSACTION;`;
}

export function resolveSyncDownQueryForV3(
  lastSyncDown: number,
  resources: Resource[],
  dapId: string,
  limit?: number
) {
  const syncDownLimit = limit || 100;
  const resourceList = resources.map((x) => `'${x}'`).join(",");
  return `BEGIN TRANSACTION; let $mutations = SELECT resourceId, timestamp FROM mutation WHERE timestamp > ${lastSyncDown} AND dapId IS NOT '${dapId}' AND resource IN [${resourceList}] AND resourceId IS NOT NONE AND resourceId IS NOT '$NONE' ORDER BY timestamp DESC; let $latestTimestamp = return array::first($mutations); let $records = select * from array::distinct(array::flatten(select value rec from (select if type::is::array(resourceId) then resourceId.map(|$v| type::record($v)); else [type::record(resourceId)] end as rec from $mutations))); return {latestTimestamp: $latestTimestamp, records: $records }; COMMIT TRANSACTION;`;
}

export function resolveSyncDownQueryV4(
  lastSyncDown: number,
  resources: Resource[],
  dapId: string
) {
  const resourceList = resources.map((x) => `'${x}'`).join(",");
  return `BEGIN TRANSACTION; let $mutations = SELECT resourceId, timestamp,action, resource FROM mutation WHERE timestamp > ${lastSyncDown} AND dapId IS NOT '${dapId}' AND resource IN [${resourceList}] AND resourceId IS NOT NONE AND resourceId IS NOT '$NONE' ORDER BY timestamp DESC; let $latestTimestamp = return array::first($mutations); let $records = select * from array::distinct(array::flatten(select value rec from (select if type::is::array(resourceId) then resourceId.map(|$v| type::record($v)); else [type::record(resourceId)] end as rec from $mutations where action is not 'delete'))); let $deleted = select * from $mutations where action is 'delete'; return {latestTimestamp: $latestTimestamp, records: $records, deleted: $deleted }; COMMIT TRANSACTION;`;
}

export function resolveCountQuery(resources: Resource[]) {
  let query = "";
  for (const resource of resources) {
    query += `array::first(select count() as ${resource} from ${resource} group all);`;
  }
  return query;
}

export function resolveCloneDownQuery(
  resources: Resource[],
  params?: {
    isExtension?: boolean;
    limit?: number;
  }
) {
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

export function resolveCloneDownPaginateQuery(
  resource: Resource,
  params: {
    offset: number;
    limit: number;
    isExtension: boolean;
  }
) {
  const { offset, limit, isExtension } = params;
  if (!isExtension) {
    return `select *, meta::id(id) as id from ${resource} LIMIT ${limit} START ${offset};`;
  }
  return `select * from ${resource} LIMIT ${limit} START ${offset};`;
}
