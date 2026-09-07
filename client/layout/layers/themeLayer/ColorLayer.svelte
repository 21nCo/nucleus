<svelte:options runes={true} />

<script lang="ts">
  import type { Snippet } from "svelte";
  import appearance from "@nucleum/stores/appearance.store";
  import {
    resolveIfActiveFgFg,
    retrieveCurrentColors
  } from "@21n/utils/theme.utils";

  let { children }: { children?: Snippet } = $props();
  const isActiveFgFg = $derived(resolveIfActiveFgFg(undefined, $appearance));
  const currentColors = $derived(retrieveCurrentColors($appearance));
</script>

<div
  class="flex flex-col w-full h-full"
  style:--fgwhenaccentbg={isActiveFgFg
    ? currentColors.fgs1
    : currentColors.bgs1}
>
  {@render children?.()}
</div>

<style>
  /* text color for accent bg */
  :global(.text-abg) {
    color: var(--fgwhenaccentbg, rgba(var(--colors-fgs1), 1));
  }
  :global(.fill-abg) {
    fill: var(--fgwhenaccentbg, rgba(var(--colors-fgs1), 1));
  }
  :global(.stroke-abg) {
    stroke: var(--fgwhenaccentbg, rgba(var(--colors-fgs1), 1));
  }
  :global(.border-abg) {
    border-color: var(--fgwhenaccentbg, rgba(var(--colors-fgs1), 1));
  }
</style>
