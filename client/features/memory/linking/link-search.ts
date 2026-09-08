import { activeResourceFilter } from "@21n/utils/utils";
import { Resource } from "@nucleum/datafn/resource.enum";
import {
  determineResourceType,
  removeDuplicatesFilter,
  resourceInList
} from "@nucleum/datafn/resource.utils";
import { isValidString } from "@21n/shared-utils/text.utils";
import { headingNodeTypes, rootNodeTypeList, type INode } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import type { CollectionType } from "@nucleum/features/collections/collection.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { isValidArray, isValidArrayWithData } from "@21n/shared-utils/obj.utils";
import { extensionDatafn } from "@nucleum/extensions/extension.store";
import { DatafnExtensionMethod } from "@nucleum/extensions/extension.store";
import { appStore } from "@nucleum/stores/app.store";
import { datafn } from "@nucleum/datafn/datafn.store";
import { resolveCollectionResource } from "@nucleum/features/collections/collection.utils";
import { recentsStore } from "@nucleum/stores/resources/recent.store";
import { get } from "svelte/store";
import { clientStorage } from "@nucleum/persistence/persistence.utils";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { parse } from "@21n/shared-utils/json.utils";
import {
  highlightSearchQuery,
  searchSort
} from "@nucleum/features/memory/linking/search-results.utils";
import { contentTypeSort } from "@nucleum/features/memory/node/node.utils";

type LinkingSearchParams = {
  resource?: Resource;
  subType?: NodeType | CollectionType;
  collectionResource?: Resource[];
  exclude?: IRecordId[];
};

const resolveSearchPriority = (item: any) => {
  if (isValidString(item?.labelSearch)) return 0;
  if (isValidString(item?.bodySearch)) return 1;
  return 2;
};

const combinedSearchSort = (a: any, b: any) => {
  const priorityDiff = resolveSearchPriority(a) - resolveSearchPriority(b);
  if (priorityDiff !== 0) return priorityDiff;

  const contentTypeDiff = contentTypeSort(a, b);
  if (contentTypeDiff !== 0) return contentTypeDiff;

  return searchSort(a, b);
};

function matchesSearchText(item: Record<string, any>, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const label = typeof item.label === "string" ? item.label : "";
  const text = typeof item.text === "string" ? item.text : "";
  return (
    label.toLowerCase().includes(normalizedQuery) ||
    text.toLowerCase().includes(normalizedQuery)
  );
}

function mergeById<T extends Record<string, any>>(items: T[], fallback: T[]) {
  return Array.from(
    new Map(
      [...items, ...fallback]
        .filter((item) => item?.id)
        .map((item) => [item.id.toString(), item])
    ).values()
  );
}

function resolveNodeParentIds(mdParent: unknown): IRecordId[] {
  if (typeof mdParent === "string") {
    return mdParent.split("-").filter(Boolean) as IRecordId[];
  }
  if (Array.isArray(mdParent)) {
    return mdParent.filter(
      (item): item is IRecordId => typeof item === "string"
    );
  }
  return [];
}

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

async function queryResourceRecords(
  resource: Resource,
  params: Record<string, any> = {}
) {
  const result = await datafn.table(resource).query(params);
  return (result.data ?? [])
    .map((record: any) => normalizeResourceRecord(resource, record))
    .filter((record: any) =>
      params.metadata?.includeTrashed || params.metadata?.includeArchived
        ? true
        : activeResourceFilter(record)
    );
}

async function queryLinkableNodes(query: string, params?: LinkingSearchParams) {
  let nodes = (await queryResourceRecords(Resource.node, {
    select: ["*", "parent.*"],
    filters: {
      contentType: {
        $in: params?.subType
          ? [params.subType]
          : [...rootNodeTypeList, ...headingNodeTypes]
      }
    },
    search: isValidString(query)
      ? {
          fields: ["label", "text"],
          query
        }
      : undefined,
    limit: isValidString(query) ? 100 : 50,
    sort: !isValidString(query) ? ["-updatedAt"] : undefined
  })) as INode[];
  if (isValidString(query)) {
    const fallbackNodes = (await queryResourceRecords(Resource.node, {
      select: ["*", "parent.*"],
      filters: {
        contentType: {
          $in: params?.subType
            ? [params.subType]
            : [...rootNodeTypeList, ...headingNodeTypes]
        }
      },
      limit: 500,
      sort: ["-updatedAt"]
    })).filter((item) => matchesSearchText(item, query)) as INode[];
    nodes = mergeById(nodes ?? [], fallbackNodes);
  }
  if (nodes && isValidArrayWithData(nodes)) {
    try {
      const parentIds: IRecordId[] = Array.from(
        new Set(
          nodes
            .flatMap((x) => resolveNodeParentIds(x?.mdParent))
            .filter(Boolean) as IRecordId[]
        )
      );
      const parentItems = (await queryResourceRecords(Resource.node, {
        select: ["label", "id", "body"],
        filters: {
          contentType: {
            $in: [...headingNodeTypes, NodeType.NODULAR_MARKDOWN]
          },
          id: { $in: parentIds?.map((x) => x.toString()) ?? [] }
        }
      })) as INode[];
      nodes = nodes.map((x: INode) => {
        const mdParent = resolveNodeParentIds(x.mdParent);
        if (!mdParent.length) return x;
        const parents = mdParent
          .map((y: IRecordId) => parentItems.find(resourceInList(y)))
          .filter(Boolean) as INode[];
        return {
          ...x,
          mdParent: parents
        } as any;
      });
    } catch (e) {
      logger.error({ at: "queryLinkingSearchResults - parentItems", error: e });
    }
  }
  return nodes;
}

async function queryLinkableCollections(
  query: string,
  collectionResource?: Resource[]
) {
  let collections = await queryResourceRecords(Resource.collection, {
    filters: {
      ...((collectionResource?.length ?? 0) > 0
        ? {
            resource: {
              $in: collectionResource
            }
          }
        : {})
    },
    search: isValidString(query)
      ? {
          fields: ["label"],
          query
        }
      : undefined
  });
  if (!isValidArrayWithData(collections) && isValidString(query)) {
    const queryLower = query.trim().toLowerCase();
    collections = (await queryResourceRecords(Resource.collection, {})).filter(
      (item: any) => {
        const label = typeof item.label === "string" ? item.label : "";
        const resource = item.resource as Resource | undefined;
        return (
          label.toLowerCase().includes(queryLower) &&
          (!collectionResource ||
            collectionResource.includes(resource as Resource))
        );
      }
    );
  }
  return collections;
}

async function queryLinkableTasks(query: string) {
  let tasks = await queryResourceRecords(Resource.task, {
    select: ["*", "objective.*"],
    search: isValidString(query)
      ? {
          fields: ["label"],
          query
        }
      : undefined,
    limit: isValidString(query) ? 100 : 50,
    sort: !isValidString(query) ? ["-updatedAt"] : undefined
  });
  if (isValidString(query)) {
    const fallbackTasks = (await queryResourceRecords(Resource.task, {
      select: ["*", "objective.*"],
      limit: 500,
      sort: ["-updatedAt"]
    })).filter((item) => matchesSearchText(item, query));
    tasks = mergeById(tasks ?? [], fallbackTasks);
  }
  return tasks;
}

export async function queryLinkingSearchResults(
  query: string,
  params?: LinkingSearchParams
) {
  logger.log({ at: "queryLinkingSearchResults", query, params });
  const collectionResource =
    params?.collectionResource ?? resolveCollectionResource(get(appStore).product);
  if (!isValidString(query)) {
    let items = [];
    if (params?.resource) {
      items = recentsStore.resolve({
        type: params?.resource,
        exclude: params?.exclude
      });
    } else {
      const recentNodes = recentsStore.resolve({
        type: Resource.node,
        exclude: params?.exclude
      });
      const recentCollections = recentsStore.resolve({
        type: Resource.collection,
        exclude: params?.exclude
      });
      items = [...recentNodes, ...recentCollections];
    }
    if (params?.subType && params.resource === Resource.node) {
      items = items.filter((x) => x.contentType === params.subType);
    } else if (params?.subType && params.resource === Resource.collection) {
      items = items.filter((x) => x.type === params.subType);
    }
    if (params?.resource === Resource.collection && collectionResource) {
      items = items.filter((x) => collectionResource.includes(x.resource));
    }
    return items;
  }
  const nodes =
    params?.resource === Resource.node || !params?.resource
      ? await queryLinkableNodes(query, params)
      : [];
  const collections =
    params?.resource === Resource.collection || !params?.resource
      ? await queryLinkableCollections(query, collectionResource)
      : [];
  const tasks =
    params?.resource === Resource.task
      ? await queryLinkableTasks(query)
      : [];
  let data = [...(nodes ?? []), ...(collections ?? []), ...(tasks ?? [])];
  if (isValidString(query) && isValidArray(data)) {
    data = highlightSearchQuery(data, query);
    data = data.filter((x) => x.labelSearch || x.bodySearch);
    data = data.sort(combinedSearchSort);
  }
  if (params?.exclude) {
    data = data.filter((x) => !params.exclude?.some(resourceInList(x.id)));
  }
  return data;
}

export async function queryLinkingSearchResultsOnExtension(
  query: string,
  resource?: Resource
) {
  let nodes: unknown[] = [];
  const isValidSearchQuery = isValidString(query);
  if (resource === Resource.node || !resource) {
    nodes = (await extensionDatafn({
      method: DatafnExtensionMethod.SELECT_MANY,
      args: {
        resource: Resource.node,
        params: {
          filters: {
            contentType: { $in: [...rootNodeTypeList, ...headingNodeTypes] }
          },
          search: isValidSearchQuery
            ? {
                fields: ["body", "label", "text"],
                query
              }
            : undefined,
          limit: 100,
          sort: isValidSearchQuery ? undefined : ["-updatedAt"]
        }
      }
    })) as unknown[];
  }
  let collections: unknown[] = [];
  if (resource === Resource.collection || !resource) {
    collections = (await extensionDatafn({
      method: DatafnExtensionMethod.SELECT_MANY,
      args: {
        resource: Resource.collection,
        params: {
          filters: {
            resource: Resource.node
          },
          search: isValidSearchQuery
            ? {
                fields: ["label"],
                query
              }
            : undefined,
          limit: 100,
          sort: isValidSearchQuery ? undefined : ["-updatedAt"]
        }
      }
    })) as unknown[];
  }
  let recentItemsArray = [];
  if (!isValidSearchQuery) {
    try {
      const recentItems = await clientStorage.get(ClientStorageKey.RECENTS);
      recentItemsArray = recentItems ? parse(recentItems) : [];
      if (recentItemsArray.length > 0) {
        recentItemsArray = recentItemsArray.filter((x: any) => {
          const itemResourceType = determineResourceType(x.id);
          return (
            itemResourceType === resource ||
            (!resource &&
              (itemResourceType === Resource.node ||
                itemResourceType === Resource.collection))
          );
        });
      }
    } catch (e) {
      logger.error({
        at: "queryLinkingSearchResultsOnExtension - recentItems",
        error: e
      });
    }
  }
  let data = [...recentItemsArray, ...(nodes ?? []), ...(collections ?? [])]
    .filter(activeResourceFilter)
    .filter(removeDuplicatesFilter);
  if (isValidString(query) && isValidArray(data)) {
    data = highlightSearchQuery(data, query);
    data = data.filter((x) => x.labelSearch || x.bodySearch);
    data = data.sort(combinedSearchSort);
  }
  return data;
}
