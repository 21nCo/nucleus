import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import { generateRandomIdv2 } from "@21n/shared-utils/crypto.utils";
import { Resource } from "@nucleum/datafn/resource.enum";

/** Generates a resource-qualified identifier with an optional stable id and prefix. */
export function generateResourceId(
  itemType: Resource,
  params?: {
    prefix?: string;
    id?: string;
    isAsString?: boolean;
  }
): IRecordId {
  const id = params?.id ?? generateRandomIdv2();
  return `${itemType}:${params?.prefix ? params.prefix + "_" : ""}${id}`;
}
