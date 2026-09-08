import { Resource } from "@nucleum/datafn/resource.enum";
import type { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import { enumToCamelCase } from "@21n/shared-utils/text.utils";
import { generateResourceId } from "@nucleum/datafn/id.utils";

/**
 * Generates a node id using the externalId and type.
 * @param externalId
 * @param type NodeType
 * @returns
 */
export function generateSyncedResourceId(externalId: string, type: NodeType) {
  return generateResourceId(Resource.node, {
    prefix: enumToCamelCase(type),
    id: externalId
  });
}
