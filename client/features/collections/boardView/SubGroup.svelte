<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/types/size.enum";
  import CollectionItems from "@nucleum/features/collections/CollectionItems.svelte";
  import { dropzone } from "@nucleum/actions/dragAndDrop.action";
  import Badge from "@21n/elements/text/Badge.svelte";
  import type { ISelectValue } from "@21n/types/select.type";
  import { resourceInList } from "@nucleum/datafn/resource.utils";
  import type { ICollectionView } from "@nucleum/features/collections/collection.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type { IActiveCollectionStore } from "@nucleum/features/collections/collection.store";
  import { filterNodesByPropertyValue } from "@nucleum/features/collections/collection.utils";
  import type { Arrangement } from "@21n/types/direction.enum";
  let {
    collection,
    view,
    subGroup,
    data,
    arrangement = undefined,
    density = undefined,
    isApplyCustomColor = false,
    onDropItem = undefined
  }: {
    collection: IActiveCollectionStore;
    view: ICollectionView;
    subGroup: any;
    data: any;
    arrangement?: Arrangement | undefined;
    density?: number | undefined;
    isApplyCustomColor?: boolean;
    onDropItem?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let isCollapsed = true;

  let _data = $derived(
    filterNodesByPropertyValue(data, view.subGroupBy, subGroup.value)
  );

  $effect(() => {
    isCollapsed = _data?.length > 0 ? false : true;
  });

  function handleDrop(e: any) {
    onDropItem?.(
      new CustomEvent("dropItem", {
        detail: {
          subGroup: subGroup.value,
          ...e
        }
      })
    );
  }
</script>

<div
  class="flex flex-col gap-2 subgroup border border-transparent rounded-md p-1 hover:border-ccs3"
  use:dropzone={{
    duringDragoverClasses: "bg-ccs3 border-ccs1",
    itemRequirement: "resource",
    onDrop: handleDrop
  }}
>
  <button
    class="label flex justify-between gap-2 w-full p-1 rounded-md"
    onclick={() => {
      isCollapsed = !isCollapsed;
    }}
  >
    <span class="flex gap-2 items-center">
      {subGroup.label}
      <Badge text={_data.length} {isApplyCustomColor} />
    </span>
    <Button
      icon={!isCollapsed ? "chevron-down" : "chevron-up"}
      size={Size.sm}
    />
  </button>
  {#if !isCollapsed}
    <div class="w-full flex flex-col gap-4">
      <CollectionItems
        items={_data}
        {arrangement}
        {isApplyCustomColor}
        isHidePreview={view.isHideThumbnailPreview}
        isHideTitle={view.isHideThumbnailTitle}
        {density}
        isDraggable={true}
        accessPoint={ResourceAccessPoint.COLLECTION}
        accessPointId={collection?.id}
        visibleProps={$collection?.properties?.filter((x) =>
          view.properties?.some(resourceInList(x))
        )}
      />
    </div>
  {/if}
</div>
