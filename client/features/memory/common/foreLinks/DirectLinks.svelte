<script lang="ts">
  import type { LinkThumbnail } from "@nucleum/features/memory/node/node.type";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import DLinkItem from "@nucleum/features/memory/common/foreLinks/DirectLinkItem.svelte";
  let {
    links = [],
    context = "capture"
  }: {
    links?: LinkThumbnail[];
    context?: "capture" | "nodethumbnail" | "nodepage";
  } = $props();
</script>

{#if isValidArrayWithData(links)}
  <div
    class="flex gap-2 w-full {context === 'capture'
      ? 'flex--wrap overflow-auto'
      : 'overflow-auto'}"
  >
    {#each links as link}
      <DLinkItem {link} {context} onRemove={() => {}} />
    {/each}
  </div>
{/if}
