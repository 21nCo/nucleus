<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import { internalUrlNodeTypeList, type INode } from "@nucleum/features/memory/node/node.type";
  let { item }: { item: INode } = $props();
  function extractDomain(url: string) {
    const domain = new URL(url).hostname;
    return domain;
  }
</script>

{#if !internalUrlNodeTypeList.includes(item.contentType) && item.url}
  <button
    class="flex gap-0.5 items-center underline text-fgs3 text-b4"
    onclick={(event) => event.stopPropagation()}
  >
    <Icon icon="link-mini" size={Size.sm} />
    <a href={item.url} target="_blank" rel="noopener noreferrer">
      {extractDomain(item.url)}
    </a>
  </button>
{/if}
