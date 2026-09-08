<script lang="ts">
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import { cn } from "@21n/utils/ui.utils";
  import { type IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import NodeTitle from "@nucleum/features/memory/node/title/NodeTitle.svelte";
  import ResourceStatusBanner from "@nucleum/components/records/RecordStatusBanner.svelte";
  import CollectionsLane from "@nucleum/features/memory/node/floatingBar/CollectionsLane.svelte";
  import { isShowStatusBanner } from "@nucleum/datafn/resource.utils";
  let { node }: { node: IActiveNodeStore } = $props();
</script>

<div
  class={cn("flex flex-col w-full justify-center items-center", {
    "mb-6 absolute z-10 bottom-0": $node.accessMode === AccessMode.SLIDESHOW,
    relative: $node.accessMode !== AccessMode.SLIDESHOW
  })}
>
  <div
    class={cn("flex flex-col gap-3 justify-center items-center", {
      "w-full": $node.accessMode !== AccessMode.SLIDESHOW,
      "mo:w-full w-9/10 max-w-9/10 2k:w-[80rem] rounded-md":
        $node.accessMode === AccessMode.SLIDESHOW
    })}
  >
    {#if isShowStatusBanner($node)}
      <div
        class={cn("rounded-md border border-brs2 shadow-md", {
          "absolute z-10 bottom-full mb-2 w-[98%]":
            $node.accessMode === AccessMode.POP ||
            $node.accessMode === AccessMode.INLINE,
          "w-full": $node.accessMode === AccessMode.FULL
        })}
      >
        <ResourceStatusBanner resource={node} />
      </div>
    {/if}
    <div
      class={cn(
        "flex flex-col gap-2 w-full justify-center items-center bg-bgs1 mo:p-2 p-3 cw:border-b cw:border-b-brs2 cw:border-t-transparent cw:rounded-none cw:bg-bgs2 cw:otop:pt-12 border-t border-t-brs2",
        {
          "rounded-b-md": $node.accessMode === AccessMode.POP,
          "w-full": $node.accessMode !== AccessMode.SLIDESHOW,
          "rounded-md shadow-md": $node.accessMode === AccessMode.SLIDESHOW
        }
      )}
    >
      <div class="flex gap-3 justify-between items-center w-full">
        <span class="flex items-center gap-4 flex-1 min-w-0">
          <NodeTitle
            node={$node}
            onLabelChange={() => {
              if ($node.label !== undefined)
                node.modify({ label: $node.label });
            }}
            onEditModeChange={(value) => {
              node.toggleEditMode(value);
            }}
          />
        </span>
      </div>
      <div class="flex w-full justify-between">
        <CollectionsLane {node} />
      </div>
    </div>
  </div>
</div>
