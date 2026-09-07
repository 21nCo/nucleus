<svelte:options runes={true} />

<script lang="ts">
  import { page } from "$app/stores";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import ResourceResolver from "@21n/layout/paint/ResourceResolver.svelte";

  let tab = $derived($page.url.searchParams.get(AccessMode.TAB));
</script>

{#if tab}
  {#key tab}
    <ResourceResolver id={tab} accessMode={AccessMode.TAB} />
  {/key}
{/if}
