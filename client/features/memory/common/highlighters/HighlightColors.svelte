<script lang="ts">
  import { highlightStore } from "@nucleum/features/memory/common/highlighters/highlight.store";
  import HightlightColorItem from "@nucleum/features/memory/common/highlighters/HightlightColorItem.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    selected = $bindable(null),
    orientation = Orientation.Horizontal,
    onColor = undefined
  }: {
    selected?: string | null;
    orientation?: Orientation;
    onColor?: ((highlighter: any) => void) | undefined;
  } = $props();
</script>

{#if $highlightStore.highlighters.length > 0}
  <span
    class={cn("flex gap-2 items-center", {
      "flex-col": orientation === Orientation.Vertical
    })}
  >
    {#each $highlightStore.highlighters as highlighter}
      <HightlightColorItem
        {highlighter}
        isActive={highlighter.id === selected}
        onClick={() => {
          selected = highlighter.id;
          onColor?.(highlighter);
        }}
      />
    {/each}
  </span>
{/if}
