<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import ResourceResolver from "@21n/layout/paint/ResourceResolver.svelte";
  import { page } from "$app/stores";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import RightSplit from "@21n/layout/RightSplit.svelte";
  let {
    children,
    id,
    componentParams = {}
  }: {
    children?: Snippet;
    id: string;
    componentParams?: any;
  } = $props();
  let split = $state<string | undefined>(undefined);
  onMount(() => {
    const sub = page.subscribe((value) => {
      split = value?.url?.searchParams.get(AccessMode.FSPLIT) ?? undefined;
    });
    return () => {
      sub();
    };
  });
</script>

<div class="flex w-full h-full">
  <div class="flex h-full {split ? 'w-1/2' : 'w-full'}">
    {#if children}
      {@render children()}
    {:else}
      <ResourceResolver
        {id}
        componentParams={{ ...componentParams, isFromSplitView: true }}
      />
    {/if}
  </div>
  {#if split}
    <RightSplit {split} accessMode={AccessMode.FSPLIT} />
  {/if}
</div>
