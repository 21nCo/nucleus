<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import type { ICollectionThumb } from "@nucleum/features/collections/collection.type";
  import { Arrangement } from "@21n/elements/direction.enum";
  import CoverRenderer from "@21n/elements/coverPicker/CoverRenderer.svelte";
  let {
    item,
    arrangement = Arrangement.LIST
  }: {
    item: ICollectionThumb;
    arrangement?: Arrangement;
  } = $props();
</script>

<div class="relative grow w-full overflow-auto">
  {#if item.cover}
    <CoverRenderer
      cover={item.cover}
      class={cn("absolute inset-0 h-full w-full object-cover", {
        "rounded-t-md":
          arrangement === Arrangement.GRID ||
          arrangement === Arrangement.MASONRY,
        "rounded-md": arrangement === Arrangement.LIST
      })}
    />
  {:else}
    <div
      class={cn("flex w-full h-full justify-center items-center bg-bgs4", {
        "rounded-t-md":
          arrangement === Arrangement.GRID ||
          arrangement === Arrangement.MASONRY,
        "rounded-md": arrangement === Arrangement.LIST
      })}
    >
      {#if arrangement === Arrangement.LIST}
        <span class="text-h3 text-fgs4 font-medium">
          {item.label?.slice(0, 1) || "?"}
        </span>
      {/if}
    </div>
  {/if}
</div>
