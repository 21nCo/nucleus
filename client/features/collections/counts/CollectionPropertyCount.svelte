<script lang="ts">
  import CountBadge from "@nucleum/features/collections/counts/CountBadge.svelte";
  import { CollectionType } from "@nucleum/features/collections/collection.type";
  import type { ICollectionThumb } from "@nucleum/features/collections/collection.type";
  let {
    item,
    isShowLabel = true
  }: {
    item: ICollectionThumb;
    isShowLabel?: boolean;
  } = $props();
</script>

{#if item.type === CollectionType.TYPED && item.properties && item.properties?.length > 0}
  <div class="flex gap-2">
    <CountBadge
      count={item.properties?.length}
      icon="cube"
      label={isShowLabel ? "properties" : undefined}
    />
  </div>
{/if}
