import { Resource } from "@21n/data/datafn/resource.enum";
import {
  AccessMode,
  type DatafnDateValue,
  ResourceActionType,
  ResourceAccessPoint
} from "@21n/data/datafn/resource.type";
import type { IRecordId } from "@21n/types/data.type";
import { logger } from "@21n/components/debug/logger.client";
import { properCase } from "@21n/shared-utils/text.utils";
import type { IResourceSwitchItem } from "@21n/types/select.type";
import { Product } from "@nucleum/schema/product.type";
import {
  nextResourceIcons,
  nextUncountableResources
} from "@21n/next/resource.utils";
import { nucleumDatafnSchema } from "@nucleum/schema/datafn";

export function resourceAction(resource: Resource, action: ResourceActionType) {
  return `${resource}_${action}`;
}

export function resourceCacheKey(resource: Resource, key: string) {
  return `${resource}-${key}`;
}

/**
 * Product resource mapping
 *  */
export function resolveProductResources(
  product: Product,
  context: "search" | "cache" | "library" | undefined = undefined
) {
  switch (product) {
    case Product.POINTRON:
      return [
        Resource.objective,
        Resource.task,
        Resource.collection,
        Resource.event
      ];
    case Product.MEMOTRON:
      if (context === "search")
        return [Resource.node, Resource.collection, Resource.space];
      else
        return [
          Resource.node,
          Resource.collection,
          Resource.space,
          Resource.relation
        ];
    case Product.NUCLEUM:
      if (context === "search")
        return [
          Resource.node,
          Resource.objective,
          Resource.event,
          Resource.space,
          Resource.task,
          Resource.collection
        ];
      else
        return [
          Resource.node,
          Resource.objective,
          Resource.event,
          Resource.space,
          Resource.task,
          Resource.collection
        ];
  }
}

export function determineResourceType(
  id: IRecordId | { tb: string } | null | undefined
): Resource {
  const tb = resolveResourceTable(id);
  return (tb as Resource | null) ?? Resource.unknown;
}

/**
 * Checks if the given items are the same resource.
 * @param item1 - The first item to compare. Can be a string or a {@link IRecordId} or an object with an id which is {@link IRecordId}
 * @param item2 - The second item to compare. Can be a string or a {@link IRecordId} or an object with an id which is {@link IRecordId}
 * @returns True if the items are the same resource, false otherwise.
 */
export function isSameResource(
  item1: IRecordId | { tb: string; id: string } | { id: IRecordId },
  item2: IRecordId | { tb: string; id: string } | { id: IRecordId }
) {
  try {
    const normalized1 = normalizeResourceId(item1);
    const normalized2 = normalizeResourceId(item2);
    return Boolean(normalized1 && normalized2 && normalized1 === normalized2);
  } catch (e) {
    logger.error({ at: "isSameResource", item1, item2, error: e });
    return false;
  }
}

/**
 * Checks if the given item is present in the list of resources.
 * @param toCheck - The resource to check for.
 * @returns A function that takes an item and returns true if it is the same resource as the given id.
 */
export function resourceInList(toCheck: IRecordId | { id: IRecordId }) {
  if (!toCheck) return () => false;
  return (item: { id: IRecordId } | IRecordId) => {
    return isSameResource(item, toCheck);
  };
}

export const removeDuplicatesFilter = (
  item: any,
  index: number,
  self: any[]
) => {
  return self.findIndex((t) => isSameResource(t, item)) === index;
};

export function isNoneResource(id: IRecordId | string | undefined) {
  if (!id) return false;
  return id.toString()?.split(":")?.pop() === "none";
}

function isObjectLike(value: unknown): value is Record<PropertyKey, unknown> {
  return Boolean(value) && typeof value === "object";
}

function hasResourceTable(value: unknown): value is { tb: string } {
  return isObjectLike(value) && "tb" in value && typeof value.tb === "string";
}

function hasStringId(value: unknown): value is { id: string } {
  return isObjectLike(value) && "id" in value && typeof value.id === "string";
}

function resolveResourceTable(value: unknown): string | null {
  if (typeof value === "string") {
    const parts = value.split(":");
    return parts.length > 1 ? parts[0] : null;
  }
  return hasResourceTable(value) ? value.tb : null;
}

function normalizeResourceId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (hasResourceTable(value) && hasStringId(value)) {
    return `${value.tb}:${value.id}`;
  }
  if (hasStringId(value)) return value.id;
  return null;
}

export function isRecordId(id: unknown, resource?: Resource) {
  const normalized = normalizeResourceId(id);
  if (resource) {
    return resolveResourceTable(id) === resource;
  }
  return Boolean(normalized && normalized.includes(":"));
}

/**
 * Shifts a resource in an array to a new position.
 * @param array - The array to shift the resource in.
 * @param fromId - The id of the resource to shift.
 * @param toId - The id of the resource to shift to.
 * @param isPlaceAfter - Whether to place the resource after the target resource.
 * @returns The new array with the resource shifted.
 */
export function shiftResourceInArray(
  array: any[],
  fromId: string,
  toId: string,
  isPlaceAfter: boolean = false
) {
  const fromIndex = array.findIndex(resourceInList(fromId));
  const toIndex = array.findIndex(resourceInList(toId));
  if (fromIndex === -1 || toIndex === -1) return array;
  const newArray = [...array];
  if (isPlaceAfter) {
    if (fromIndex < toIndex) {
      newArray.splice(toIndex, 0, newArray.splice(fromIndex, 1)[0]);
    } else {
      newArray.splice(toIndex + 1, 0, newArray.splice(fromIndex, 1)[0]);
    }
  } else {
    const insertionIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    newArray.splice(insertionIndex, 0, newArray.splice(fromIndex, 1)[0]);
  }
  return newArray;
}

/**
 * Extracts the resource id from an HTML element id. Typically of the format
 * `elementType-resourceId-accessPoint-accessPointId`.
 * Example: "thumbnail-node:a3828733ae7b24e43483eb0d154cbccd-collection-collection:fef39f69d2f29949e93897a37e024f09"
 * @param id - The element id to extract the resource id from.
 * @returns The resource id or null if it cannot be extracted.
 */
export function extractResourceIdFromElementId(id: string) {
  const parts = id.split("-");
  if (parts.length > 1) return parts[1];
  return null;
}

export function resourceIdToElementId(
  elementType: string,
  resourceId: IRecordId,
  accessPoint: ResourceAccessPoint | undefined = undefined,
  accessPointId: IRecordId | undefined = undefined
) {
  return `${elementType}-${resourceId}-${accessPoint ?? "none"}-${accessPointId ?? "none"}`;
}

export function resolveBulkSelectionAccessPointId(
  accessPoint: ResourceAccessPoint | undefined,
  accessPointId: IRecordId | undefined = undefined
) {
  if (accessPoint === undefined) return accessPointId;
  if (
    accessPoint === ResourceAccessPoint.BROWSER ||
    accessPoint === ResourceAccessPoint.LIBRARY
  )
    return undefined;
  return accessPointId;
}

const baseResourceIcons: Record<string, string> = {
  [Resource.collection]: "collection",
  [Resource.node]: "hexagon",
  [Resource.relation]: "relation",
  [Resource.objective]: "target",
  [Resource.task]: "check-square",
  [Resource.todo]: "check-square-offset",
  [Resource.space]: "combination",
  [Resource.event]: "calendar-blank",
  [Resource.session]: "clock",
  [Resource.place]: "map-pin",
  [Resource.input]: "incoming"
};

const resourceIconMap: Record<string, string> = {
  ...baseResourceIcons,
  ...nextResourceIcons
};

export function resolveResourceIcon(resource: Resource): string {
  return resourceIconMap[resource] ?? "question";
}

export const availableResources = new Set<Resource>(
  nucleumDatafnSchema.resources.map((resource) => resource.name as Resource)
);

export function resolveResourceLabel(resource: Resource) {
  if (resource === Resource.objective) return "Objectives";
  if (nextUncountableResources.has(resource)) return properCase(resource);
  return properCase(resource) + "s";
}

export function resolveResourceSwitcher(): IResourceSwitchItem[] {
  return Object.values(Resource).map((resource) => ({
    label: resolveResourceLabel(resource),
    value: resource,
    icon: resolveResourceIcon(resource),
    isDisabled: !availableResources.has(resource),
    badge: !availableResources.has(resource) ? "Planned" : undefined
  }));
}

export function isTrashedResource(
  resource: { trashedAt?: unknown } | null | undefined
) {
  return resource?.trashedAt != null;
}

export function resolveTrashedAtDate(
  resource: { trashedAt?: DatafnDateValue | null } | null | undefined
) {
  if (resource?.trashedAt == null) return undefined;
  const trashedAt =
    resource.trashedAt instanceof Date
      ? resource.trashedAt
      : new Date(resource.trashedAt);
  return Number.isNaN(trashedAt.getTime()) ? undefined : trashedAt;
}

export function isShowStatusBanner(resource: any) {
  if (!resource) return false;
  return (
    resource.isArchived ||
    isTrashedResource(resource) ||
    resource.isAncestorInactive ||
    resource.isLocked ||
    resource.isInReadOnlyMode
  );
}

export function resolveResourceActionIcon(action: ResourceActionType) {
  switch (action) {
    case ResourceActionType.ARCHIVE:
      return "archive";
    case ResourceActionType.UNARCHIVE:
      return "archive";
    case ResourceActionType.DELETE:
      return "trash";
    case ResourceActionType.RESTORE:
      return "trash";
    case ResourceActionType.STAR:
      return "star";
    case ResourceActionType.UNSTAR:
      return "star";
    case ResourceActionType.ADD_TO:
      return "plus";
    case ResourceActionType.REMOVE_FROM:
      return "minus-circle";
    case ResourceActionType.LINK:
      return "link";
    case ResourceActionType.UNLINK:
      return "unlink";
    case ResourceActionType.EDIT:
      return "edit";
    case ResourceActionType.DUPLICATE:
      return "duplicate";
    case ResourceActionType.COPY_LINK:
      return "copy";
    case ResourceActionType.COPY_CONTENTS:
      return "copy";
    case ResourceActionType.TOGGLE_READ_MODE:
      return "book-open";
    case ResourceActionType.TOGGLE_FOCUS_MODE:
      return "circle";
    case ResourceActionType.LOCK:
      return "lock";
    case ResourceActionType.UNLOCK:
      return "lock-open";
    case ResourceActionType.CONVERT:
      return "convert";
    default:
      return "question";
  }
}

export const determineResourceAccessMode = (id: IRecordId): AccessMode => {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const mode = (Object.values(AccessMode) as string[]).find(
    (m) => m !== AccessMode.INLINE && searchParams.get(m) === id.toString()
  );
  return (mode as AccessMode) || AccessMode.INLINE;
};
