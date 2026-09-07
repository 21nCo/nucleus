<script lang="ts">
  import { Placement } from "@21n/types/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { enumToString, properCase } from "@21n/shared-utils/text.utils";
  import { CollectionType } from "@nucleum/features/collections/collection.type";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  let {
    contentType = undefined,
    placement = Placement.TopLeft
  }: {
    contentType?: CollectionType | NodeType | undefined;
    placement?: Placement;
  } = $props();

  function isNodeContentType(
    value: CollectionType | NodeType
  ): value is NodeType {
    return Object.values(NodeType).includes(value as NodeType);
  }
</script>

{#if contentType}
  <div
    class={cn("absolute flex bg-bgs2 rounded-md px-2 py-1 m-2 text-b4", {
      "top-0 left-0": placement === Placement.TopLeft,
      "bottom-0 right-0": placement === Placement.BottomRight
    })}
  >
    {#if contentType === CollectionType.TYPED || contentType === CollectionType.QUERY}
      {properCase(contentType)} collection
    {:else if contentType !== CollectionType.UNTYPED && isNodeContentType(contentType)}
      {properCase(enumToString(contentType))}
    {/if}
  </div>
{/if}
