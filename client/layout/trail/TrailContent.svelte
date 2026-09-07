<script lang="ts">
  import { vTrail } from "../topNav/tabs/tabs.store";
  import ResourceResolver from "@21n/layout/paint/ResourceResolver.svelte";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  const parts = $derived($vTrail.activated?.split("-") ?? []);
  const lastPartId = $derived(
    parts.length > 0 ? parts[parts.length - 1] : undefined
  );
</script>

{#if lastPartId}
  <div class="w-full h-full">
    <ResourceResolver id={lastPartId} accessMode={AccessMode.INLINE} />
  </div>
{/if}
