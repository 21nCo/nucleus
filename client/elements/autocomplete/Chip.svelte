<script lang="ts">
  import type { Snippet } from "svelte";
  import { ChipVariant } from "@21n/elements/autocomplete/chipVariant.enum";
  import Icon from "@21n/elements/Icon.svelte";
  let {
    children,
    hideCloseIcon = false,
    variant
  }: {
    children?: Snippet;
    hideCloseIcon?: boolean;
    variant: ChipVariant;
  } = $props();

  function getClassesBasedOnVariant() {
    switch (variant) {
      case ChipVariant.OUTLINED:
        return "border border-brs3 rounded-md text-fgs1";
      case ChipVariant.FILLED:
        return "bg-bgs3 hover:bg-bgs3";
      default:
        return "bg-bgs3 hover:bg-bgs3";
    }
  }
</script>

<div
  class={`py-1 px-3 gap-1 flex items-center text-fgs2 ${getClassesBasedOnVariant()}`}
>
  {@render children?.()}
  {#if !hideCloseIcon}
    <Icon icon="cross" />
  {/if}
</div>
