import { Resource } from "@nucleum/datafn/resource.enum";
import { type IRecordId } from "@nucleum/schema/legacy/data.type";

import { determineResourceType } from "@nucleum/datafn/resource.utils";
import { datafn } from "@nucleum/datafn/datafn.store";

function normalizeEventRecord<T extends Record<string, any>>(record: T): T {
  const label = record.label ?? record.event ?? "New event";
  return {
    ...record,
    event: record.event ?? label,
    label,
    startUnix: record.startUnix ?? record.value?.startUnix,
    endUnix: record.endUnix ?? record.value?.endUnix
  };
}

function normalizeResourceRecord(
  resource: Resource,
  record: Record<string, any>
) {
  return resource === Resource.event ? normalizeEventRecord(record) : record;
}

/** Reads a resource including inactive records and normalizes legacy event fields. */
export function resolveResource(id: IRecordId) {
  const resource = determineResourceType(id);
  return datafn
    .table(resource as any)
    .query({
      filters: { id },
      limit: 1,
      metadata: {
        includeTrashed: true,
        includeArchived: true
      }
    } as any)
    .then((result: any) =>
      result.data?.[0]
        ? normalizeResourceRecord(resource, result.data[0])
        : undefined
    );
}
