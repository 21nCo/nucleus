<script lang="ts">
  import LinkItems from "@nucleum/features/memory/common/linkbox/LinkItems.svelte";
  import LinkSearch from "@nucleum/features/memory/common/linkbox/LinkSearch.svelte";
  import InlineFeedbackText from "@nucleum/extensions/clipper/InlineFeedbackText.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { AlertType, type IInlineStatus } from "@nucleum/stores/notifications/notification.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import {
    determineResourceType,
    isSameResource
  } from "@nucleum/datafn/resource.utils";
  import type { ICollectionItemPropertyValue } from "@nucleum/features/collections/collection.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import type {
    INodeThumb,
    INodeLinkThumb
  } from "@nucleum/features/memory/node/node.type";
  import { LinkType } from "@nucleum/datafn/link.type";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { Size } from "@21n/elements/size.enum";
  import { datafn } from "@nucleum/datafn/datafn.store";

  let {
    savedNodeId,
    savedNode,
    expandedLink = $bindable(null),
    onSavedNodeChange = undefined
  }: {
    savedNodeId?: IRecordId | undefined;
    savedNode?: INodeThumb | undefined;
    expandedLink?: IRecordId | null;
    onSavedNodeChange?:
      | ((detail: { savedNode: LinkedNodeThumb }) => void)
      | undefined;
  } = $props();

  type LinkedNodeThumb = INodeThumb & {
    links?: INodeLinkThumb[];
    collections?: IRecordId[];
    propertyValues?: ICollectionItemPropertyValue[];
  };
  const linkableResources = [
    Resource.node,
    Resource.objective,
    Resource.task,
    Resource.event
  ] as const;

  type LinkableResource = (typeof linkableResources)[number];

  let linkSearchQuery = $state("");
  let linkedResources = $state<IRecordId[]>([]);
  let linkedProperties = $state<ICollectionItemPropertyValue[]>([]);
  let linkFeedback = $state<IInlineStatus | undefined>(undefined);
  let isLinkboxLoading = $state(false);

  let lastRefreshedId: string | undefined;
  const linkSearchExclusions = $derived(
    [...(linkedResources ?? []), ...(savedNodeId ? [savedNodeId] : [])].filter(
      Boolean
    ) as IRecordId[]
  );

  const hasLinkedResources = $derived(linkedResources.length > 0);

  function isLinkableResource(resource: Resource): resource is LinkableResource {
    return linkableResources.includes(resource as LinkableResource);
  }

  function normalizeCollectionRows(rows: unknown) {
    return (Array.isArray(rows) ? rows : [])
      .map((row: any) => row?.to ?? row?.id ?? row)
      .filter(Boolean) as IRecordId[];
  }

  function normalizePropertyRows(rows: unknown) {
    return (Array.isArray(rows) ? rows : []).map((row: any) =>
      row?.to
        ? ({
            id: row.to,
            value: row.value ?? null,
            collectionId: row.collectionId
          } as ICollectionItemPropertyValue)
        : row
    ) as ICollectionItemPropertyValue[];
  }

  async function queryRelationRowsForNode(nodeId: IRecordId) {
    const nodeIdStr = nodeId.toString();
    const results = (await datafn.query(
      linkableResources.map((resource) => ({
        resource,
        select: ["id", "links.#"],
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      }))
    )) as Array<{ data?: Array<{ links?: any[] }> }>;
    const uniqueRows = new Map<string, any>();
    results
      .flatMap(
        (result) =>
          result.data?.flatMap((record: any) => record.links ?? []) ?? []
      )
      .filter(
        (link: any) =>
          link?.linkType === LinkType.DIRECT &&
          (link.from?.toString() === nodeIdStr ||
            link.to?.toString() === nodeIdStr)
      )
      .forEach((link: any) => {
        uniqueRows.set(`${link.from}|${link.to}|${link.linkType}`, link);
    });
    return Array.from(uniqueRows.values());
  }

  async function queryLinkedDataForNode(nodeId: IRecordId) {
    const nodeIdStr = nodeId.toString();
    const [nodeResult, ...relationResults] = (await datafn.query([
      {
        resource: Resource.node,
        select: ["*", "collections.#", "propertyValues.#"],
        filters: {
          id: nodeIdStr
        }
      },
      ...linkableResources.map((resource) => ({
        resource,
        select: ["id", "links.#"],
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      }))
    ])) as Array<{ data?: Array<any> }>;
    const uniqueRows = new Map<string, any>();
    relationResults
      .flatMap(
        (result) =>
          result.data?.flatMap((record: any) => record.links ?? []) ?? []
      )
      .filter(
        (link: any) =>
          link?.linkType === LinkType.DIRECT &&
          (link.from?.toString() === nodeIdStr ||
            link.to?.toString() === nodeIdStr)
      )
      .forEach((link: any) => {
        uniqueRows.set(`${link.from}|${link.to}|${link.linkType}`, link);
      });
    return {
      node: nodeResult.data?.[0],
      relationRows: Array.from(uniqueRows.values())
    };
  }

  async function relateNodeToCollection(nodeId: IRecordId, collectionId: IRecordId) {
    return datafn.node.mutate({
      operation: "relate",
      id: nodeId.toString(),
      relations: {
        collections: [
          {
            $ref: collectionId.toString(),
            fromResource: Resource.node
          }
        ]
      },
      context: ResourceAccessPoint.CAPTURE
    } as any);
  }

  async function relateNodeToRecord(nodeId: IRecordId, targetId: IRecordId) {
    const targetResource = determineResourceType(targetId);
    if (!isLinkableResource(targetResource)) return;
    return datafn.node.mutate({
      operation: "relate",
      id: nodeId.toString(),
      relations: {
        links: [
          {
            $ref: targetId.toString(),
            fromResource: Resource.node,
            toResource: targetResource,
            linkType: LinkType.DIRECT
          }
        ]
      },
      context: ResourceAccessPoint.CAPTURE
    } as any);
  }

  async function unrelateNodeFromCollection(
    nodeId: IRecordId,
    collectionId: IRecordId
  ) {
    return datafn.node.mutate({
      operation: "unrelate",
      id: nodeId.toString(),
      relations: {
        collections: [collectionId.toString()]
      },
      context: ResourceAccessPoint.CAPTURE
    } as any);
  }

  async function unrelateNodeFromRecord(nodeId: IRecordId, targetId: IRecordId) {
    const targetResource = determineResourceType(targetId);
    await datafn.node.mutate({
      operation: "unrelate",
      id: nodeId.toString(),
      relations: {
        links: [
          {
            $ref: targetId.toString(),
            linkType: LinkType.DIRECT
          }
        ]
      },
      context: ResourceAccessPoint.CAPTURE
    } as any);
    if (!isLinkableResource(targetResource)) return;
    await datafn.table(targetResource).mutate({
      operation: "unrelate",
      id: targetId.toString(),
      relations: {
        links: [
          {
            $ref: nodeId.toString(),
            linkType: LinkType.DIRECT
          }
        ]
      },
      context: ResourceAccessPoint.CAPTURE
    } as any);
  }

  $effect(() => {
    if (savedNodeId) {
      const nodeIdStr = savedNodeId.toString();
      if (lastRefreshedId !== nodeIdStr) {
        lastRefreshedId = nodeIdStr;
        refreshLinkedData(savedNodeId).catch((error) => {
          logger.error({ at: "LinkBoxOnSaver.reactiveRefresh", error });
        });
      }
      return;
    }

    linkedResources = [];
    linkedProperties = [];
    expandedLink = null;
    lastRefreshedId = undefined;
  });

  export async function refreshLinkedData(nodeId: IRecordId | undefined) {
    if (!nodeId) return;
    const nodeIdStr = nodeId.toString();
    try {
      isLinkboxLoading = true;
      const { node, relationRows } = await queryLinkedDataForNode(nodeId);

      const directLinks: INodeLinkThumb[] = relationRows
        .map((link) => {
          const isOutgoing = link.from.toString() === nodeIdStr;
          const target = (isOutgoing ? link.to : link.from) as IRecordId;
          return {
            linkedTo: target,
            linkType: link.linkType,
            id: `${link.from}|${link.to}|${link.linkType ?? LinkType.DIRECT}`,
            tags: link.tags,
            direction: isOutgoing ? "outgoing" : "incoming"
          } as INodeLinkThumb;
        })
        .filter((link) => !link.linkType || link.linkType === LinkType.DIRECT);

      const collections = normalizeCollectionRows(node?.collections);
      const propertyValues = normalizePropertyRows(node?.propertyValues);

      linkedProperties = propertyValues;

      const uniqueIds = new Set<string>();
      const aggregated: IRecordId[] = [];
      directLinks.forEach((link) => {
        const idStr = link.linkedTo.toString();
        if (!uniqueIds.has(idStr)) {
          uniqueIds.add(idStr);
          aggregated.push(link.linkedTo);
        }
      });
      collections.forEach((collection) => {
        const idStr = collection.toString();
        if (!uniqueIds.has(idStr)) {
          uniqueIds.add(idStr);
          aggregated.push(collection);
        }
      });

      linkedResources = aggregated;

      if (
        expandedLink &&
        !aggregated.some((id) => isSameResource(id, expandedLink as IRecordId))
      ) {
        expandedLink = null;
      }

      const updatedNode: LinkedNodeThumb | undefined = node
        ? ({
            ...(node as INodeThumb),
            links: directLinks,
            collections,
            propertyValues
          } as LinkedNodeThumb)
        : savedNode
          ? ({
              ...(savedNode as INodeThumb),
              links: directLinks,
              collections,
              propertyValues
            } as LinkedNodeThumb)
          : undefined;

      if (updatedNode) {
        savedNode = updatedNode;
        onSavedNodeChange?.({ savedNode: updatedNode });
      }
    } catch (error) {
      logger.error({ at: "LinkBoxOnSaver.refreshLinkedData", error });
    } finally {
      isLinkboxLoading = false;
    }
  }

  async function handleLinkSelect(e: CustomEvent<{ item: { id: IRecordId } }>) {
    if (!savedNodeId || !e.detail?.item?.id) return;
    const targetId = e.detail.item.id as IRecordId;
    const resourceType = determineResourceType(targetId);
    linkFeedback = {
      message:
        resourceType === Resource.collection
          ? "Adding to collection..."
          : "Linking...",
      type: AlertType.PROGRESS
    };

    try {
      if (resourceType === Resource.collection) {
        if (
          linkedResources.some((item) =>
            isSameResource(item, targetId as IRecordId)
          )
        ) {
          linkFeedback = {
            message: "Already part of this collection.",
            type: AlertType.ERROR
          };
          return;
        }
        await relateNodeToCollection(savedNodeId, targetId);
      } else {
        const existingLinks = await queryRelationRowsForNode(savedNodeId);
        if (
          existingLinks.some(
            (link) =>
              link.from?.toString() === savedNodeId.toString() &&
              link.to?.toString() === targetId.toString()
          )
        ) {
          linkFeedback = {
            message: "Link already exists.",
            type: AlertType.ERROR
          };
          return;
        }
        await relateNodeToRecord(savedNodeId, targetId);
      }
      linkFeedback = {
        message:
          resourceType === Resource.collection
            ? "Added to collection!"
            : "Link added!",
        type: AlertType.SUCCESS
      };
      await refreshLinkedData(savedNodeId);
    } catch (error) {
      logger.error({ at: "LinkBoxOnSaver.handleLinkSelect", error });
      linkFeedback = {
        message: error instanceof Error ? error.message : "Failed to add link.",
        type: AlertType.ERROR
      };
    } finally {
      linkSearchQuery = "";
    }
  }

  async function handleUnlink(e: CustomEvent<IRecordId>) {
    if (!savedNodeId || !e.detail) return;
    const targetId = e.detail;
    const resourceType = determineResourceType(targetId);
    linkFeedback = {
      message:
        resourceType === Resource.collection
          ? "Removing from collection..."
          : "Removing link...",
      type: AlertType.PROGRESS
    };
    try {
      if (resourceType === Resource.collection) {
        await unrelateNodeFromCollection(savedNodeId, targetId);
      } else {
        await unrelateNodeFromRecord(savedNodeId, targetId);
      }
      linkFeedback = {
        message:
          resourceType === Resource.collection
            ? "Removed from collection."
            : "Link removed.",
        type: AlertType.SUCCESS
      };
      await refreshLinkedData(savedNodeId);
    } catch (error) {
      logger.error({ at: "LinkBoxOnSaver.handleUnlink", error });
      linkFeedback = {
        message: "Failed to remove link.",
        type: AlertType.ERROR
      };
    }
  }

  async function handlePropertyChange(
    e: CustomEvent<ICollectionItemPropertyValue>
  ) {
    if (!savedNodeId || !e.detail) return;
    const property = e.detail;
    linkFeedback = {
      message: "Saving property...",
      type: AlertType.PROGRESS
    };
    try {
      let propertyValues = linkedProperties.filter(
        (item) => !isSameResource(item.id, property.id)
      );
      propertyValues = [...propertyValues, property];
      linkedProperties = propertyValues;
      if (savedNode) {
        savedNode = { ...savedNode, propertyValues };
        onSavedNodeChange?.({ savedNode });
      }
      await datafn.node.mutate({
        operation: "relate",
        id: savedNodeId.toString(),
        relations: {
          propertyValues: [
            {
              $ref: property.id.toString(),
              fromResource: Resource.node,
              collectionId: property.collectionId?.toString(),
              value: property.value
            }
          ]
        },
        context: ResourceAccessPoint.CAPTURE
      } as any);
      linkFeedback = {
        message: "Property saved.",
        type: AlertType.SUCCESS
      };
    } catch (error) {
      logger.error({ at: "LinkBoxOnSaver.handlePropertyChange", error });
      linkFeedback = {
        message: "Failed to save property.",
        type: AlertType.ERROR
      };
    }
  }
</script>

<section
  class="flex flex-col gap-4 w-full border border-brs3 rounded-md bg-bgs1 p-2"
>
  <div class={hasLinkedResources ? "px-1 pt-1" : ""}>
    <LinkSearch
      accessPoint={ResourceAccessPoint.CAPTURE}
      bind:searchQuery={linkSearchQuery}
      excludeFromSearch={linkSearchExclusions}
      onSelect={handleLinkSelect}
    />
  </div>
  {#if hasLinkedResources}
    <div class="flex flex-col gap-2 overflow-y-auto styledscroll">
      <LinkItems
        accessPoint={ResourceAccessPoint.CLIPPER}
        links={linkedResources}
        nodeId={savedNodeId}
        propertyValues={linkedProperties}
        isExpandable={true}
        bind:expand={expandedLink}
        onUnlink={handleUnlink}
        onPropertyChange={handlePropertyChange}
      />
    </div>
  {/if}
  {#if isLinkboxLoading}
    <InlineFeedbackText
      feedback={{
        message: "Loading links...",
        type: AlertType.PROGRESS
      }}
      size={Size.sm}
    />
  {:else if linkFeedback}
    <InlineFeedbackText
      feedback={linkFeedback}
      size={Size.sm}
      isAutoDissappear={true}
    />
  {/if}
</section>
