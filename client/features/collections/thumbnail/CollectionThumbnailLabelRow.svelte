<script lang="ts">
  import {
    ResourceAccessPoint,
    ResourceAccessPointState
  } from "@nucleum/datafn/resource.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { Arrangement } from "@21n/elements/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { type ICollectionThumb } from "@nucleum/features/collections/collection.type";
  import CollectionThumbnailLabel from "@nucleum/features/collections/thumbnail/CollectionThumbnailLabel.svelte";
  import CollectionItemCount from "@nucleum/features/collections/counts/CollectionItemCount.svelte";
  import RecordStarStatusFeedback from "@nucleum/components/records/RecordStarStatusFeedback.svelte";
  let {
    item,
    arrangement = Arrangement.LIST,
    accessPoint = ResourceAccessPoint.BROWSER,
    accessPointState = ResourceAccessPointState.DEFAULT,
    itemCount = undefined
  }: {
    item: ICollectionThumb;
    arrangement?: Arrangement;
    accessPoint?: ResourceAccessPoint;
    accessPointState?: ResourceAccessPointState;
    itemCount?: number | undefined;
  } = $props();
</script>

<div
  class={cn({
    "grid grid-cols-[1fr_auto] flex-1 gap-1": arrangement === Arrangement.LIST,
    "flex w-full":
      arrangement === Arrangement.GRID || arrangement === Arrangement.MASONRY
  })}
>
  <div
    class={cn("text-b2", {
      "flex items-center gap-3 min-w-0": arrangement === Arrangement.LIST,
      "flex w-full justify-between":
        arrangement === Arrangement.GRID || arrangement === Arrangement.MASONRY
    })}
  >
    <CollectionThumbnailLabel {item} />
    {#if accessPoint !== ResourceAccessPoint.BROWSER}
      <RecordStarStatusFeedback isStarred={item.isStarred} />
    {/if}
  </div>
  {#if arrangement === Arrangement.LIST && accessPoint === ResourceAccessPoint.BROWSER && accessPointState === ResourceAccessPointState.DEFAULT}
    <CollectionItemCount {item} count={itemCount} />
  {/if}
</div>
