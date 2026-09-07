<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import type { IBlockBrowserItem } from "@nucleum/components/markdown/blockBrowser/blockBrowser.type";
  let {
    item,
    onSelect = undefined
  }: {
    item: IBlockBrowserItem;
    onSelect?: ((type: IBlockBrowserItem["type"]) => void) | undefined;
  } = $props();
</script>

<button
  class="flex flex-col gap-2 items-center bg-bgs3 hover:bg-bgs4 rounded-md p-2 h-fit"
  onclick={() => {
    onSelect?.(item.type);
  }}
>
  <Icon icon={item.icon} />
  <span class="text-b3 text-fgs2 whitespace-nowrap">
    {item.label}
  </span>
</button>
