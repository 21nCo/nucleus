<svelte:options runes={true} />

<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import RightSplit from "@21n/layout/RightSplit.svelte";
  import context from "@nucleum/stores/context.store";
  import { cn } from "@21n/utils/ui.utils";
  let {
    children,
    isBottomBarAbsent
  }: {
    children?: Snippet;
    isBottomBarAbsent?: boolean;
  } = $props();
  let split = $state<string | undefined>(undefined);
  onMount(() => {
    const sub = page.subscribe((value) => {
      split = value?.url?.searchParams.get(AccessMode.SPLIT) ?? undefined;
    });
    return () => {
      sub();
    };
  });
</script>

<div
  class={cn("flex w-full h-full", {
    "pr-2 pb-2": $context.experiments?.isEnableRoundedMain,
    "pb-2": isBottomBarAbsent
  })}
>
  <div
    class={cn("flex w-full h-full", {
      "rounded-xl bg-bgs1 border border-brs2 overflow-hidden":
        $context.experiments?.isEnableRoundedMain
    })}
  >
    <div class="flex h-full {split ? 'min-w-1/2 w-1/2 shrink-0' : 'w-full'}">
      {@render children?.()}
    </div>
    {#if split}
      <RightSplit {split} accessMode={AccessMode.SPLIT} />
    {/if}
  </div>
</div>
