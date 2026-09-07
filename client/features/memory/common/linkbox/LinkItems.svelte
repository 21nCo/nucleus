<script lang="ts">
  import LinkItem from "@nucleum/features/memory/common/linkbox/LinkItem.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import {
    determineResourceType,
    isSameResource,
    removeDuplicatesFilter
  } from "@nucleum/datafn/resource.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { resolveCollectionTypes } from "@nucleum/features/collections/collection.utils";
  import PropertiesListView from "@nucleum/features/collections/properties/PropertiesListView.svelte";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import LinkTagger from "@nucleum/features/memory/linking/LinkTagger.svelte";
  import type { INodeLinkThumb } from "@nucleum/features/memory/node/node.type";
  import LinkTags from "@nucleum/features/memory/linking/LinkTags.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import context from "@nucleum/stores/context.store";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type { ICollectionItemPropertyValue } from "@nucleum/features/collections/collection.type";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import view from "@nucleum/stores/view.store";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteDataStore, toSvelteStore } from "@datafn/svelte";
  let {
    links = [],
    propertyValues = [],
    isWrapItems = false,
    parentBgIndex = 1,
    isExpandable = false,
    nodeId = undefined,
    isReadOnlyMode = false,
    expand = $bindable(null),
    accessPoint = ResourceAccessPoint.CLIPPER,
    subContext = undefined,
    onClick = undefined,
    onExpansion = undefined,
    onPropertyChange = undefined,
    onUnlink = undefined
  }: {
    links?: IRecordId[];
    propertyValues?: ICollectionItemPropertyValue[];
    isWrapItems?: boolean;
    parentBgIndex?: number;
    isExpandable?: boolean;
    nodeId?: IRecordId | undefined;
    isReadOnlyMode?: boolean;
    expand?: IRecordId | null;
    accessPoint?: ResourceAccessPoint;
    subContext?: "clipper-modal" | undefined;
    onClick?:
      | ((
          event: CustomEvent<{ item: IRecordId; event: MouseEvent | Event }>
        ) => void)
      | undefined;
    onExpansion?:
      | ((
          event: CustomEvent<
            | "not-type"
            | "node"
            | "no-props"
            | "has-props"
            | "loading"
            | "error"
            | null
          >
        ) => void)
      | undefined;
    onPropertyChange?: ((event: CustomEvent<any>) => void) | undefined;
    onUnlink?: ((event: CustomEvent<IRecordId>) => void) | undefined;
  } = $props();
  let expansionState = $state<
    "not-type" | "node" | "no-props" | "has-props" | "loading" | "error"
  >("loading");
  let types = $state<any[]>([]);
  let link = $state({} as INodeLinkThumb);
  let propertyCount = $state<number | undefined>(undefined);
  const _links = $derived(links?.filter(removeDuplicatesFilter) ?? []);
  const linkedRecordsStore = $derived.by(() =>
    toSvelteDataStore(
      datafn.recordsByIdsSignal({
        ids: _links,
        selectByResource: {
          [Resource.node]: [
            "id",
            "label",
            "text",
            "avatar",
            "contentType",
            "url",
            "metadata"
          ],
          [Resource.collection]: ["id", "label", "avatar", "typeToExtend.*"]
        },
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      }),
      { initialData: {} }
    )
  );
  let collectionExpansionRequest = 0;

  const expandedResource = $derived(
    expand ? determineResourceType(expand) : undefined
  );

  const expandedNodeLinkStore = $derived.by(() =>
    toSvelteStore<Array<{ links?: Record<string, any>[] }>>(
      datafn.node.signal({
        select: ["id", "links.#"],
        filters: {
          id:
            nodeId && expand && expandedResource === Resource.node
              ? nodeId.toString()
              : "__datafn_empty_link_expansion__"
        },
        limit: 1,
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      }),
      { initialData: [] }
    )
  );

  const expandedNodeLinks = $derived.by(() => {
    if (!expand || expandedResource !== Resource.node) return [];
    const expandedId = expand.toString();
    return ($expandedNodeLinkStore.data[0]?.links ?? [])
      .filter((row: any) => row.to?.toString() === expandedId)
      .map((row: any) => ({
        id: `${row.from}|${row.to}`,
        in: row.from,
        out: row.to,
        linkType: row.linkType,
        tags: row.tags ?? [],
        location: row.location,
        metadata: row.metadata,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        createdBy: row.createdBy,
        updatedBy: row.updatedBy
      }));
  });

  $effect(() => {
    if (!expand) {
      collectionExpansionRequest += 1;
      types = [];
      link = {} as INodeLinkThumb;
      propertyCount = undefined;
      propagateExpansionState();
      return;
    }
    if (expandedResource === Resource.collection) {
      refreshCollectionExpansion(expand);
      return;
    }
    if (expandedResource === Resource.node) {
      collectionExpansionRequest += 1;
      types = [];
      propertyCount = undefined;
      if (!nodeId) {
        link = {} as INodeLinkThumb;
        expansionState = "error";
        propagateExpansionState();
        return;
      }
      if ($expandedNodeLinkStore.loading && !expandedNodeLinks.length) {
        link = {} as INodeLinkThumb;
        expansionState = "loading";
        propagateExpansionState();
        return;
      }
      if (isValidArrayWithData(expandedNodeLinks)) {
        link = { links: expandedNodeLinks, linkedTo: nodeId };
        expansionState = "node";
      } else {
        link = {} as INodeLinkThumb;
        expansionState = "error";
      }
      propagateExpansionState();
    }
  });

  async function refreshCollectionExpansion(item: IRecordId) {
    const requestId = ++collectionExpansionRequest;
    try {
      expansionState = "loading";
      propertyCount = undefined;
      const result = await resolveCollectionTypes([item], true);
      if (
        requestId !== collectionExpansionRequest ||
        !expand ||
        !isSameResource(item, expand)
      ) {
        return;
      }
      if (result && isValidArrayWithData(result)) {
        types = result;
        if (
          types[0]?.properties?.length > 0 ||
          types[0]?.extendProperties?.length > 0
        )
          expansionState = "has-props";
        else expansionState = "no-props";
      } else {
        expansionState = "not-type";
      }
      propagateExpansionState();
    } catch (e) {
      console.error(e);
      expansionState = "error";
    }
  }

  function propagateExpansionState() {
    const expansionEvent = new CustomEvent<
      | "not-type"
      | "node"
      | "no-props"
      | "has-props"
      | "loading"
      | "error"
      | null
    >("expansion", {
      detail: expand ? expansionState : null
    });
    onExpansion?.(expansionEvent);
  }

  function onClickItem(item: IRecordId, e: any) {
    if (isExpandable) {
      expand = expand && isSameResource(expand, item) ? null : item;
      if (expand) {
        expansionState = "loading";
        propertyCount = undefined;
      }
      propagateExpansionState();
      e.stopPropagation();
    } else {
      const clickEvent = new CustomEvent<{
        item: IRecordId;
        event: MouseEvent | Event;
      }>("click", {
        detail: {
          item,
          event: e
        }
      });
      onClick?.(clickEvent);
    }
  }
</script>

{#if _links?.length > 0}
  <div
    class={cn("flex gap-2 w-full", {
      "flex-wrap": isWrapItems,
      "overflow-x-auto": !isWrapItems
    })}
  >
    {#each _links as item (item.toString())}
      <LinkItem
        id={item}
        record={$linkedRecordsStore[item.toString()]}
        {parentBgIndex}
        {accessPoint}
        isAlwaysShowRemove={accessPoint === ResourceAccessPoint.CAPTURE ||
          accessPoint === ResourceAccessPoint.CLIPPER}
        isRemovable={!isReadOnlyMode &&
          (accessPoint !== ResourceAccessPoint.SELF ||
            (accessPoint === ResourceAccessPoint.SELF &&
              !$context.isTouchDevice))}
        isActive={expand && isSameResource(expand, item) ? true : undefined}
        onclick={(e) => {
          if (
            $context.isTouchDevice &&
            accessPoint === ResourceAccessPoint.SELF
          )
            return;
          onClickItem(item, e);
        }}
        onGoToResource={(e) => {
          onClickItem(item, e);
        }}
        onRemove={() => {
          if (expand && isSameResource(expand, item)) {
            expand = null;
          }
          const unlinkEvent = new CustomEvent<IRecordId>("unlink", {
            detail: item
          });
          onUnlink?.(unlinkEvent);
        }}
      />
    {/each}
  </div>
  {#if isExpandable && expand}
    {#if expansionState === "loading" || expansionState === "not-type" || expansionState === "no-props" || expansionState === "error"}
      <div
        class={cn(
          "flex justify-center items-center w-full h-full text-fgs3 cw:text-b3 px-1 py-2 text-b2",
          {
            "text-ars1": expansionState === "error"
          }
        )}
        in:fly={{
          y: -20,
          duration: 300,
          easing: quintOut
        }}
      >
        {#if expansionState === "loading"}
          loading...
        {:else if expansionState === "not-type"}
          Not a typed collection.
        {:else if expansionState === "no-props"}
          No properties found.
        {:else if expansionState === "error" && accessPoint === ResourceAccessPoint.CAPTURE}
          Adding relationship to node links is not available yet for capture
        {:else if expansionState === "error"}
          Something went wrong.
        {/if}
      </div>
    {:else if expansionState === "node"}
      <LinkTagger bind:link />
      {#if link?.tags && link.tags.length > 0}
        <LinkTags bind:link />
      {/if}
    {:else if expansionState === "has-props"}
      <div
        class={cn("w-full p-2 rounded-md flex flex-col gap-3 items-start", {
          "h-96 bg-bgs2 bg-opacity-30":
            accessPoint === ResourceAccessPoint.CLIPPER &&
            subContext !== "clipper-modal",
          "h-60":
            accessPoint === ResourceAccessPoint.CLIPPER &&
            subContext === "clipper-modal",
          "h-fit max-h-96": accessPoint === ResourceAccessPoint.CAPTURE
        })}
        in:fly={{
          y: -20,
          duration: 300,
          easing: quintOut
        }}
      >
        <Text
          content={`${types[0]?.label ? types[0].label + ":" : ""} Properties (${propertyCount ?? ""})`}
          style={TextStyle.SECTION_HEADING_SMALL}
        />
        <div class="overflow-y-auto h-full w-full styledscroll">
          <PropertiesListView
            parentBgIndex={accessPoint === ResourceAccessPoint.CAPTURE &&
            $view.isPortrait
              ? 2
              : 1}
            {types}
            values={propertyValues}
            resource={Resource.node}
            context="clip"
            onChange={(e) => {
              const propertyChangeEvent = new CustomEvent<any>(
                "propertyChange",
                {
                  detail: e.detail
                }
              );
              onPropertyChange?.(propertyChangeEvent);
            }}
            onPropertyCount={(count) => {
              propertyCount = count;
            }}
          />
          {#if accessPoint === ResourceAccessPoint.CLIPPER}
            <ScrollViewBottomSpacer />
          {/if}
        </div>
      </div>
    {/if}
  {/if}
{/if}
