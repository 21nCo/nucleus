<script lang="ts">
  import { Arrangement } from "@21n/types/direction.enum";
  import { type ICollectionThumb } from "@nucleum/features/collections/collection.type";
  import ResourceGridThumbnail from "@nucleum/application/record/thumbnail/ResourceGridThumbnail.svelte";
  import Cover from "@nucleum/features/collections/thumbnail/Cover.svelte";
  import { Size } from "@21n/types/size.enum";
  import {
    ResourceAccessPoint,
    ResourceAccessPointState
  } from "@nucleum/datafn/resource.type";
  import ResourceThumbnailBase from "@nucleum/application/record/thumbnail/ResourceThumbnailBase.svelte";
  import CollectionThumbnailLabelRow from "@nucleum/features/collections/thumbnail/CollectionThumbnailLabelRow.svelte";
  import ResourceThumbnailContentTypeOverlay from "@nucleum/application/record/thumbnail/ResourceThumbnailContentTypeOverlay.svelte";
  import CollectionPropertyCount from "@nucleum/features/collections/counts/CollectionPropertyCount.svelte";
  import CollectionItemCount from "@nucleum/features/collections/counts/CollectionItemCount.svelte";
  import CollectionThumbnailLabel from "@nucleum/features/collections/thumbnail/CollectionThumbnailLabel.svelte";
  import CollectionThumbnailAvatar from "@nucleum/features/collections/thumbnail/CollectionThumbnailAvatar.svelte";
  let {
    item: itemProp,
    arrangement = Arrangement.LIST,
    size = Size.md,
    accessPoint = ResourceAccessPoint.BROWSER,
    accessPointState = ResourceAccessPointState.DEFAULT,
    itemCount = undefined,
    onClick = undefined
  }: {
    item?: ICollectionThumb;
    arrangement?: Arrangement;
    size?: Size.sm | Size.md;
    accessPoint?: ResourceAccessPoint;
    accessPointState?: ResourceAccessPointState;
    itemCount?: number | undefined;
    onClick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
  let item = $state<ICollectionThumb | undefined>(itemProp);

  $effect(() => {
    item = itemProp;
  });
</script>

{#if item}
  <ResourceThumbnailBase {item} {accessPoint} {arrangement}>
    {#if arrangement === Arrangement.LIST}
      <button
        class="flex items-center h-16 gap-3 w-full rounded-md bg-bgs2 border border-transparent hover:border-bgs2 p-3"
        onclick={onClick}
      >
        <CollectionThumbnailAvatar {item} size={Size.lg} />
        <div class="flex flex-col gap-1 flex-grow">
          <div class="flex items-center gap-2 text-b2">
            <CollectionThumbnailLabel
              {item}
              isShowAvatar={false}
              isShowStarStatus={accessPoint !== ResourceAccessPoint.BROWSER}
            />
            <span class="flex gap-1">
              {#if accessPointState === ResourceAccessPointState.DEFAULT}
                <CollectionItemCount
                  {item}
                  count={itemCount}
                  isShowLabel={true}
                />
              {/if}
              <CollectionPropertyCount {item} isShowLabel={false} />
            </span>
          </div>
          {#if item.description}
            <span class="text-b3 text-fgs3 truncate text-left">
              {item.description}
            </span>
          {/if}
        </div>
      </button>
    {:else if arrangement === Arrangement.GRID || arrangement === Arrangement.MASONRY}
      <ResourceGridThumbnail {item} {size} onclick={onClick}>
        <!-- {#if item.type === CollectionType.TYPED || item.type === CollectionType.QUERY}
        <div
          class="absolute top-0 left-0 flex bg-bgs2 rounded-md px-2 py-1 m-2 text-b3"
        >
          {properCase(item.type)} collection
        </div>
      {/if} -->
        <!-- <ResourceThumbnailContentTypeOverlay contentType={item.type} /> -->
        <Cover {item} {arrangement} />
        {#snippet bottom()}
          <CollectionThumbnailLabelRow
            item={item!}
            {arrangement}
            {accessPoint}
            {itemCount}
          />
          <span class="flex gap-2">
            {#if accessPointState === ResourceAccessPointState.DEFAULT}
              <CollectionItemCount
                item={item!}
                count={itemCount}
                isShowLabel={true}
              />
            {/if}
            <CollectionPropertyCount
              item={item!}
              isShowLabel={size === Size.md}
            />
          </span>
        {/snippet}
      </ResourceGridThumbnail>
    {/if}
  </ResourceThumbnailBase>
{/if}
