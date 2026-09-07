<script lang="ts">
  import type { IBreadcrumbItem } from "@21n/elements/breadcrumbsV2/breadcrumbItem.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import Breadcrumbs from "@21n/elements/breadcrumbsV2/Breadcrumbs.svelte";
  import {
    headingNodeTypes,
    NodeType,
    type INode
  } from "@nucleum/features/memory/node/node.type";
  import { resourceInList } from "@nucleum/datafn/resource.utils";
  import BreadcrumbMini from "@21n/elements/breadcrumb/BreadcrumbMini.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";
  let {
    mdParent = undefined,
    id = undefined,
    currentLabel = undefined,
    isThumbnailContext = false,
    onClick = undefined
  }: {
    mdParent?: IRecordId[] | INode[] | undefined;
    id?: IRecordId | undefined;
    currentLabel?: string | undefined;
    isThumbnailContext?: boolean;
    onClick?:
      | ((
          event: CustomEvent<{ event: MouseEvent; item: IBreadcrumbItem }>
        ) => void)
      | undefined;
  } = $props();

  function isResolvedNode(item: IRecordId | INode): item is INode {
    return typeof item === "object" && "label" in item;
  }

  const parentIds = $derived.by(() => {
    if (
      mdParent &&
      Array.isArray(mdParent) &&
      mdParent.some(isResolvedNode)
    ) {
      return [];
    }
    return mdParent?.map((x) => x.toString()) ?? [];
  });
  const parentNodeStore = $derived.by(() =>
    toSvelteStore(
      datafn.node.signal({
        select: ["label", "id", "body"],
        filters: {
          contentType: {
            $in: [...headingNodeTypes, NodeType.NODULAR_MARKDOWN]
          },
          id: { $in: parentIds }
        }
      }),
      { initialData: [] }
    )
  );
  const parentItems = $derived.by(() => {
    if (
      mdParent &&
      Array.isArray(mdParent) &&
      mdParent.some(isResolvedNode)
    ) {
      return mdParent as INode[];
    }
    return $parentNodeStore.data as INode[];
  });
  const breadcrumbs = $derived.by(() => {
    if (!mdParent || !parentItems || parentItems.length === 0) return [];
    const items = mdParent
      .map((x) => {
        const item = parentItems.find(resourceInList(x));
        return {
          label: item?.label ?? item?.body ?? "",
          resourceId: item?.id
        };
      })
      .filter((x) => x);
    if (items.length > 0 && !isThumbnailContext && currentLabel) {
      items.push({
        label: currentLabel,
        resourceId: id?.toString()
      });
    }
    return items;
  });
  function onBreadcrumbClick(e: CustomEvent) {
    if (!e.detail.item.resourceId) return;
    onClick?.(e as CustomEvent<{ event: MouseEvent; item: IBreadcrumbItem }>);
  }
</script>

{#if breadcrumbs && breadcrumbs.length > 0}
  {#if isThumbnailContext}
    <BreadcrumbMini
      hierarchy={breadcrumbs?.map((x) => x.label)}
      truncateLength={30}
    />
  {:else}
    <Breadcrumbs
      items={breadcrumbs}
      isPreventDefault={true}
      onClick={onBreadcrumbClick}
      limit={4}
    />
  {/if}
{/if}
