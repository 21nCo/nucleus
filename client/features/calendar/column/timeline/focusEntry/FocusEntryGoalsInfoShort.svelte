<script lang="ts">
  import Badge from "@21n/elements/text/Badge.svelte";
  import type { ISessionThumb } from "@nucleum/features/focus/logs/log.type";
  let { item }: { item: ISessionThumb } = $props();
</script>

{#if item.expandedItems && item.expandedItems.length > 0}
  <div class="flex items-center text-b3 text-fgs2">
    {item.expandedItems[0].label}
    {#if item.expandedItems.length > 1}
      <Badge text={`+${item.expandedItems.length - 1}`} />
    {/if}
  </div>
{/if}
