import { Resource } from "@nucleum/datafn/resource.enum";
import { type IRecordId } from "@21n/types/data.type";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { toasts } from "@nucleum/stores/notification.store";
import {
  onNodeArchive,
  onNodeTrash,
  onNodeUnarchive
} from "@nucleum/features/memory/node/node.store";
import type { BulkEditStore } from "@nucleum/components/record/bulkedit.store";
import { appStore } from "@nucleum/stores/app.store";
import { determineResourceType } from "@nucleum/datafn/resource.utils";
import { datafn } from "@nucleum/datafn/datafn.store";
import type { NucleumDatafnResource } from "@nucleum/schema";
import { Action } from "@21n/types/action.enum";
import { resolveUnixTimestamp } from "@21n/shared-utils/time.utils";
import { LinkType } from "@nucleum/features/memory/linking/link.type";
import { assertDatafnMutationSucceeded } from "@nucleum/datafn/mutation.utils";

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

function normalizeResourceRecord(resource: Resource, record: Record<string, any>) {
  return resource === Resource.event ? normalizeEventRecord(record) : record;
}

export const MAX_FILE_SIZE_MB = 100;

function isCollectionItemResource(resource: Resource) {
  return resource === Resource.node || resource === Resource.objective;
}

function isLinkableResource(resource: Resource) {
  return (
    resource === Resource.node ||
    resource === Resource.objective ||
    resource === Resource.task ||
    resource === Resource.event
  );
}

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

export class BulkEditor {
  resource: Resource = Resource.node;
  multiSelectStore: BulkEditStore;
  constructor(
    resource: Resource = Resource.node,
    multiSelectStore: BulkEditStore
  ) {
    this.resource = resource;
    this.multiSelectStore = multiSelectStore;
  }

  async bulkUnlink(items: IRecordId[], accessPointId: IRecordId) {
    const accessPointResource = determineResourceType(accessPointId);
    await Promise.all(
      items.map(async (item) => {
        const itemResource = determineResourceType(item);
        if (accessPointResource === Resource.collection) {
          if (!isCollectionItemResource(itemResource)) return undefined;
          return datafn.table(itemResource).mutate({
            operation: "unrelate",
            id: item.toString(),
            relations: {
              collections: [accessPointId.toString()]
            }
          } as any);
        }
        if (!isLinkableResource(itemResource)) return undefined;
        await datafn.table(itemResource).mutate({
          operation: "unrelate",
          id: item.toString(),
          relations: {
            links: [
              {
                $ref: accessPointId.toString(),
                linkType: LinkType.DIRECT
              }
            ]
          }
        } as any);
        if (accessPointResource === Resource.node) {
          await datafn.node.mutate({
            operation: "unrelate",
            id: accessPointId.toString(),
            relations: {
              links: [
                {
                  $ref: item.toString(),
                  linkType: LinkType.DIRECT
                }
              ]
            }
          } as any);
        }
        return true;
      })
    );
    return true;
  }

  async run(action: string, data?: unknown) {
    let isResetItems = false;
    if (this.resource === Resource.everything) return;
    const state = this.multiSelectStore.getState();
    const items = state.selectedIds;
    const accessPointId = state.context?.accessPointId;
    const accessPoint = state.context?.accessPoint;
    const additionalParams = {
      context: accessPoint
    };
    try {
      logger.log({
        at: "BulkEditor.run",
        action,
        items,
        accessPointId,
        accessPoint
      });
      if (this.resource === Resource.node) {
        switch (action) {
          case "unlink":
            if (!accessPointId) {
              toasts.error(
                "Unable to unlink items. Missing context information."
              );
              return;
            }
            const result = await this.bulkUnlink(items, accessPointId);
            logger.debug({ at: "BulkEditor.run unlink", result });
            onSuccess(action, items.length, Resource.node);
            break;
          case "link":
            appStore.runAction(Action.BULK_LINK, {
              componentParams: {
                label: "Link to a node",
                resource: Resource.node,
                multiSelectStore: this.multiSelectStore
              }
            });
            break;
          case "linkbox":
            appStore.runAction(Action.BULK_LINK, {
              componentParams: {
                label: "Link to a node or add to a collection",
                multiSelectStore: this.multiSelectStore
              }
            });
            break;
          case "collect":
            appStore.runAction(Action.BULK_LINK, {
              componentParams: {
                label: "Add to collection",
                resource: Resource.collection,
                multiSelectStore: this.multiSelectStore
              }
            });
            break;
          case "star":
            await bulkMerge(Resource.node, { isStarred: true });
            onSuccess(action, items.length, Resource.node);
            break;
          case "unstar":
            await bulkMerge(Resource.node, { isStarred: false });
            onSuccess(action, items.length, Resource.node);
            break;
          case "archive":
            await bulkMerge(Resource.node, { isArchived: true });
            await onNodeArchive(items);
            onSuccess(action, items.length, Resource.node);
            break;
          case "unarchive":
            await bulkMerge(Resource.node, { isArchived: false });
            await onNodeUnarchive(items);
            onSuccess(action, items.length, Resource.node);
            break;
          case "delete":
            await bulkTrash(Resource.node);
            await onNodeTrash(items);
            onSuccess(action, items.length, Resource.node);
            break;
        }
      } else if (this.resource === Resource.collection) {
        switch (action) {
          case "star":
            await bulkMerge(Resource.collection, { isStarred: true });
            onSuccess(action, items.length, Resource.collection);
            break;
          case "unstar":
            await bulkMerge(Resource.collection, { isStarred: false });
            onSuccess(action, items.length, Resource.collection);
            break;
          case "archive":
            await bulkMerge(Resource.collection, { isArchived: true });
            onSuccess(action, items.length, Resource.collection);
            break;
          case "unarchive":
            await bulkMerge(Resource.collection, { isArchived: false });
            onSuccess(action, items.length, Resource.collection);
            break;
          case "delete":
            await bulkTrash(Resource.collection);
            onSuccess(action, items.length, Resource.collection);
            break;
        }
      } else if (this.resource === Resource.objective) {
        switch (action) {
          case "star":
            await bulkMerge(Resource.objective, { isStarred: true });
            onSuccess(action, items.length, this.resource);
            break;
          case "unstar":
            await bulkMerge(Resource.objective, { isStarred: false });
            onSuccess(action, items.length, this.resource);
            break;
          case "archive":
            await bulkMerge(Resource.objective, { isArchived: true });
            onSuccess(action, items.length, this.resource);
            break;
          case "unarchive":
            await bulkMerge(Resource.objective, { isArchived: false });
            onSuccess(action, items.length, this.resource);
            break;
          case "delete":
            await bulkTrash(Resource.objective);
            onSuccess(action, items.length, this.resource);
            break;
        }
      } else if (this.resource === Resource.task) {
        switch (action) {
          case "complete":
            await bulkMerge(Resource.task, {
              isChecked: true,
              completedAtUnix: resolveUnixTimestamp()
            });
            onSuccess(action, items.length, this.resource);
            break;
          case "moveToToday":
            const dateUnix = resolveUnixTimestamp(new Date());
            await bulkMerge(Resource.task, { dateUnix });
            onSuccess(action, items.length, this.resource);
            break;
          case "setDate":
            const targetDateUnix = resolveUnixTimestamp(data as Date);
            await bulkMerge(Resource.task, { dateUnix: targetDateUnix });
            onSuccess(action, items.length, this.resource);
            break;
          case "delete":
            await bulkTrash(Resource.task);
            onSuccess(action, items.length, this.resource);
            break;
        }
      }
      if (isResetItems) {
        this.multiSelectStore.reset();
        return true;
      }
    } catch (e) {
      toasts.error("Failed to perform bulk action");
      return false;
    }

    async function bulkMerge(
      resource: NucleumDatafnResource,
      record: Record<string, any>
    ) {
      const result = await datafn.table(resource).mutate(
        items.map((id) => ({
          operation: "merge",
          id: id.toString(),
          record: {
            id: id.toString(),
            ...record
          },
          context: additionalParams?.context
        }))
      );
      assertDatafnMutationSucceeded(result);
    }

    async function bulkTrash(resource: NucleumDatafnResource) {
      const result = await datafn.table(resource).mutate(
        items.map((id) => ({
          operation: "trash",
          id: id.toString(),
          context: additionalParams?.context
        }))
      );
      assertDatafnMutationSucceeded(result);
    }

    function onSuccess(action: string, count: number, resource: Resource) {
      toasts.success(resolveMessage(action, count, resource));
      isResetItems = true;
    }

    function resolveMessage(action: string, count: number, resource: Resource) {
      let prefix = "";
      const itemsLabel = `${count} ${resource}${count > 1 ? "s" : ""}`;
      switch (action) {
        case "star":
          prefix = "Starred";
          break;
        case "unstar":
          prefix = "Unstarred";
          break;
        case "archive":
          prefix = "Archived";
          break;
        case "unarchive":
          prefix = "Unarchived";
          break;
        case "delete":
          prefix = "Deleted";
          break;
        case "unlink":
          prefix = "Unlinked";
          break;
        case "setDate":
          return `Date changed for ${itemsLabel} successfully`;
        case "moveToToday":
          return `Moved ${itemsLabel} to today`;
      }
      return `${prefix} ${itemsLabel} successfully ${!prefix ? "updated" : ""}`;
    }
  }
}
