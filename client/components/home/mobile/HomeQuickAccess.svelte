<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import Badge from "@21n/elements/text/Badge.svelte";
  import type { IQuickAccessItem } from "@nucleum/components/home/home.type";
  let {
    items = [],
    onItemClick = undefined
  }: {
    items?: IQuickAccessItem[];
    onItemClick?: ((item: IQuickAccessItem) => void) | undefined;
  } = $props();

  function handleItemClick(item: IQuickAccessItem) {
    onItemClick?.(item);
  }

  function formatCount(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count.toString();
  }
</script>

<div class="px-4 py-2">
  <div class="grid grid-cols-2 gap-2">
    {#each items as item}
      <button
        class="flex items-center justify-between gap-2 px-2 bg-bgs1 hover:bg-bgs3 rounded-lg transition-colors h-11"
        onclick={() => handleItemClick(item)}
      >
        <div class="flex items-center gap-1">
          <Icon icon={item.icon} size={Size.sm} class="text-fgs2" />
          <div class="flex items-center gap-1.5">
            <span class="text-fgs1 text-b2">{item.label}</span>
            {#if item.count !== undefined}
              <Badge text={formatCount(item.count)} />
            {/if}
          </div>
        </div>
        <Icon icon="chevron-right" size={Size.sm} class="text-fgs2" />
      </button>
    {/each}
  </div>
</div>
