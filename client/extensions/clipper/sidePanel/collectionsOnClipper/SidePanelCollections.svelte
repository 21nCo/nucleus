<script lang="ts">
  import { extensionDatafn } from "@nucleum/extensions/extension.store";
  import { DatafnExtensionMethod } from "@nucleum/extensions/extension.store";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import {
    CollectionLayout,
    CollectionType
  } from "@nucleum/features/collections/collection.type";
  import type { ICollection } from "@nucleum/features/collections/collection.type";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import { activeResourceFilter } from "@21n/utils/utils";
  import CollectionsList from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/CollectionsList.svelte";
  import CollectionItemsView from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/CollectionItemsView.svelte";
  import type {
    CollectionData,
    CollectionItem
  } from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/types";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import Badge from "@21n/elements/text/Badge.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/types/size.enum";
  import NewCollectionWizard from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/NewCollectionWizard.svelte";
  import { logger } from "@nucleum/components/debug/logger.client";
  import ErrorStatusPane from "@21n/elements/feedback/ErrorStatusPane.svelte";
  import { generateResourceId } from "@nucleum/datafn/id.utils";

  let {
    currentUrl
  }: {
    currentUrl: string;
  } = $props();

  let collections: CollectionData[] = [];
  let selectedCollection: CollectionData | null = null;
  let collectionItems: CollectionItem[] = [];
  let isLoading = true;
  let isLoadingItems = false;
  let isHideEmptyCollections = true;
  let isShowNewCollectionWizard = false;
  let newCollectionLabel: string | undefined = undefined;

  const webContentTypes = [
    NodeType.WEB_PAGE,
    NodeType.YOUTUBE_VIDEO,
    NodeType.YOUTUBE_SHORT,
    NodeType.YOUTUBE_CHANNEL,
    NodeType.TWEET,
    NodeType.TWITTER_PROFILE,
    NodeType.REDDIT_POST,
    NodeType.DISCORD_THREAD,
    NodeType.TED_VIDEO,
    NodeType.INSTAGRAM_POST,
    NodeType.INSTAGRAM_REEL,
    NodeType.FACEBOOK_POST,
    NodeType.TWITCH_STREAM,
    NodeType.STACKOVERFLOW_THREAD,
    NodeType.GITHUB_REPO,
    NodeType.GITHUB_PROFILE,
    NodeType.GITHUB_DISCUSSION,
    NodeType.GITLAB_PROJECT,
    NodeType.GIST
  ];

  async function queryWebNodesWithCollections() {
    return (
      (await extensionDatafn({
        method: DatafnExtensionMethod.SELECT_MANY,
        args: {
          resource: Resource.node,
          params: {
            filters: {
              contentType: { $in: webContentTypes }
            },
            select: [
              "id",
              "label",
              "url",
              "body",
              "metadata",
              "contentType",
              "createdAt",
              "updatedAt",
              "collections.#"
            ]
          }
        }
      })) ?? []
    );
  }

  function collectionRowsForNode(node: any, collectionId: string) {
    return (node.collections ?? []).filter(
      (row: any) =>
        (row.to ?? row.out ?? row.id)?.toString() === collectionId.toString()
    );
  }

  function latestCollectionUpdatedAt(nodes: any[], collectionId: string) {
    const timestamps = nodes
      .flatMap((node) =>
        collectionRowsForNode(node, collectionId).map(
          (row: any) =>
            row.updatedAt ?? row.createdAt ?? node.updatedAt ?? node.createdAt
        )
      )
      .map((value) => new Date(value || 0).getTime())
      .filter((value) => Number.isFinite(value) && value > 0);
    return timestamps.length > 0
      ? new Date(Math.max(...timestamps))
      : undefined;
  }

  async function loadCollections() {
    try {
      isLoading = true;
      const allCollections = await extensionDatafn({
        method: DatafnExtensionMethod.SELECT_MANY,
        args: {
          resource: Resource.collection,
          params: {}
        }
      });

      const webNodes = await queryWebNodesWithCollections();

      const collectionsWithCounts = await Promise.all(
        (allCollections || [])
          .filter(activeResourceFilter)
          .filter(
            (collection: ICollection) => collection.resource === Resource.node
          )
          .map(async (collection: ICollection) => {
            const collectionId = collection.id.toString();
            const collectionNodes = webNodes.filter(
              (node: any) =>
                collectionRowsForNode(node, collectionId).length > 0
            );

            const lastModified = latestCollectionUpdatedAt(
              collectionNodes,
              collectionId
            );

            return {
              id: collectionId,
              label: collection.label || "Untitled Collection",
              avatar: collection.avatar,
              type: collection.type || CollectionType.UNTYPED,
              itemCount: collectionNodes.length,
              lastModified
            };
          })
      );

      const filteredCollections = isHideEmptyCollections
        ? collectionsWithCounts.filter(
            (collection: CollectionData) => collection.itemCount > 0
          )
        : collectionsWithCounts;

      collections = filteredCollections.sort(
        (a: CollectionData, b: CollectionData) => {
          if (!a.lastModified && !b.lastModified) return 0;
          if (!a.lastModified) return 1;
          if (!b.lastModified) return -1;
          return b.lastModified.getTime() - a.lastModified.getTime();
        }
      );
    } catch (err) {
      logger.error({
        at: "SidePanelCollections.loadCollections",
        err
      });
      throw err;
    } finally {
      isLoading = false;
    }
  }

  async function loadCollectionItems(collection: CollectionData) {
    try {
      isLoadingItems = true;
      selectedCollection = collection;

      const nodes = (await queryWebNodesWithCollections()).filter(
        (node: any) => collectionRowsForNode(node, collection.id).length > 0
      );
      if (nodes.length === 0) {
        collectionItems = [];
        return;
      }

      const sortedNodes = (nodes || []).sort((a: any, b: any) => {
        const aModified = new Date(a.updatedAt || a.createdAt).getTime();
        const bModified = new Date(b.updatedAt || b.createdAt).getTime();
        return bModified - aModified;
      });

      collectionItems = sortedNodes.map((node: any) => ({
        ...node,
        id: node.id.toString()
      }));
    } catch (err) {
      console.error("Error loading collection items:", err);
      collectionItems = [];
    } finally {
      isLoadingItems = false;
    }
  }

  function handleCollectionClick(collection: CollectionData) {
    loadCollectionItems(collection);
  }

  function handleBackClick() {
    selectedCollection = null;
    collectionItems = [];
  }

  function handleHideEmptyToggle(event: CustomEvent<boolean>) {
    isHideEmptyCollections = event.detail;
    loadCollections();
  }

  async function handleNewCollectionSave(label: string) {
    newCollectionLabel = label;
    const collectionId = generateResourceId(Resource.collection);
    const viewId = generateResourceId(Resource.view);
    await extensionDatafn({
      method: DatafnExtensionMethod.MUTATION,
      args: {
        resource: Resource.view,
        params: {
          operation: "insert",
          id: viewId,
          record: {
            id: viewId,
            layout: CollectionLayout.BOARD,
            label: "Default",
            tabBy: "none",
            groupBy: "none",
            subGroupBy: "none"
          }
        } as any
      }
    });
    const result = await extensionDatafn({
      method: DatafnExtensionMethod.MUTATION,
      args: {
        resource: Resource.collection,
        params: [
          {
            operation: "insert",
            id: collectionId,
            record: {
              id: collectionId,
              label: newCollectionLabel,
              type: CollectionType.TYPED,
              typeToExtend: "",
              resource: Resource.node
            }
          },
          {
            operation: "relate",
            id: collectionId,
            relations: {
              views: [{ $ref: viewId, sortOrder: 0 }]
            }
          }
        ] as any
      }
    });
    if (result) {
      isHideEmptyCollections = false;
      await loadCollections();
    }
    newCollectionLabel = undefined;
    isShowNewCollectionWizard = false;
  }
</script>

<div class="flex flex-col w-full flex-1 overflow-y-auto">
  {#await loadCollections()}
    <EmptyStatusView isLoadingState={true} />
  {:then}
    {#if selectedCollection}
      <CollectionItemsView
        {selectedCollection}
        {collectionItems}
        {isLoadingItems}
        {currentUrl}
        onBack={handleBackClick}
      />
      <div class="p-4 border-b border-bgs3 bg-bgs2">
        <div class="text-fgs3 text-b3 text-center">
          Click to open the web page in the current tab.
          <div>Cmd + click to open in new tab</div>
        </div>
      </div>
    {:else}
      <div
        class="h-16 min-h-16 flex items-center justify-center border-b border-bgs3 bg-bgs2"
      >
        <div class="flex items-center justify-between w-full px-2">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-fgs1 text-b2 font-medium">Collections</h2>
              <Badge text="beta" />
            </div>
            <p class="text-fgs3 text-b3">
              Collections that has web page nodes.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Toggle
              icon={isShowNewCollectionWizard ? "cross" : "plus"}
              parentBgIndex={2}
              bgSize={Size.sm}
              tooltip={isShowNewCollectionWizard
                ? "Cancel"
                : "Create new collection"}
              bind:on={isShowNewCollectionWizard}
            />
            <Toggle
              icon="hide"
              parentBgIndex={2}
              bgSize={Size.sm}
              tooltip={isHideEmptyCollections ? "Show empty" : "Hide empty"}
              on={isHideEmptyCollections}
              onChange={handleHideEmptyToggle}
            />
          </div>
        </div>
      </div>
      {#if isShowNewCollectionWizard}
        <NewCollectionWizard
          bind:label={newCollectionLabel}
          onSave={handleNewCollectionSave}
        />
      {/if}
      <CollectionsList
        {collections}
        onCollectionClick={handleCollectionClick}
      />
    {/if}
  {:catch}
    <ErrorStatusPane
      error="Failed to load collections"
      subText="Please reload the page to try again."
    />
  {/await}
</div>
