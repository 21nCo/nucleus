<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import type { ICollectionView } from "@nucleum/features/collections/collection.type";
  import { Size } from "@21n/types/size.enum";
  import { TextStyle } from "@21n/types/text.enum";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { cn } from "@21n/utils/ui.utils";
  import SubGroup from "@nucleum/features/collections/boardView/SubGroup.svelte";
  import {
    calculateGroupingCounts,
    filterNodesByPropertyValue,
    resolveOptionsForGrouping
  } from "@nucleum/features/collections/collection.utils";
  import TabCountBadge from "@nucleum/features/collections/counts/TabCountBadge.svelte";
  import { resourceInList } from "@nucleum/datafn/resource.utils";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { dropzone } from "@nucleum/actions/dragAndDrop.action";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type { IActiveCollectionStore } from "@nucleum/features/collections/collection.store";
  import CollectionItems from "@nucleum/features/collections/CollectionItems.svelte";
  let {
    collection,
    view,
    group,
    data,
    isBoardOverflow = false,
    onDropItem = undefined
  }: {
    collection: IActiveCollectionStore;
    view: ICollectionView;
    group: any;
    data: any;
    isBoardOverflow?: boolean;
    onDropItem?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let dev_isRenderColors = true;

  let boardCounts = $derived(calculateGroupingCounts(data, view.subGroupBy));
  let subGroups = $derived(
    resolveOptionsForGrouping(
      view.subGroupBy,
      $collection.properties ?? [],
      boardCounts,
      { isBoardView: true }
    )
  );
  let _groupData = $derived(
    filterNodesByPropertyValue(data, view.groupBy, group.value)
  );

  function handleDropForSubGroup(e: any) {
    onDropItem?.(
      new CustomEvent("dropItem", {
        detail: {
          subGroup: e.detail.subGroup,
          item: e.detail.id,
          group: group.value
        }
      })
    );
  }

  function handleDrop(e: any) {
    if (!e.id) return;
    onDropItem?.(
      new CustomEvent("dropItem", {
        detail: {
          item: e.id,
          group: group.value
        }
      })
    );
  }
</script>

<CustomColorPropagator
  class="h-full min-w-[24rem] dp:min-w-[28rem] 2k:w-[30rem]"
  color={group.color}
>
  <div
    class={cn(
      "board relative h-full w-full flex flex-col gap-2 border border-brs3 px-4 mb-2 rounded-md",
      {
        "overflow-y-auto": isBoardOverflow,
        "border-ccs3 bg-ccs5": group.color && dev_isRenderColors,
        "border-brs3 bg-bgs1": !group.color || !dev_isRenderColors
      }
    )}
    style="height: calc(100vh - 150px);"
    use:dropzone={{
      duringDragoverClasses: "!border-ccs1",
      itemRequirement: "resource",
      onDrop: handleDrop,
      enabled: subGroups.length < 1
    }}
  >
    <div
      class={cn(
        "board-title sticky top-0 z-1 flex items-center w-full justify-between py-4",
        {
          "bg-bgs1": !dev_isRenderColors,
          "bg-ccs5": dev_isRenderColors
        }
      )}
    >
      <div class="flex items-center gap-2">
        <Text content={group.label} style={TextStyle.PANEL_HEADING_SMALL} />
        <TabCountBadge
          count={_groupData?.length || 0}
          isActive={false}
          hasCustomColor={!!group.color && dev_isRenderColors}
        />
      </div>
    </div>
    <div class="grow w-full flex flex-col gap-2">
      {#if isValidArrayWithData(subGroups)}
        {#each subGroups as subGroup}
          <SubGroup
            {subGroup}
            {view}
            {collection}
            data={_groupData}
            arrangement={view.arrangement}
            density={1}
            isApplyCustomColor={group.color}
            onDropItem={handleDropForSubGroup}
          />
        {/each}
      {:else if isValidArrayWithData(_groupData)}
        <CollectionItems
          items={_groupData}
          arrangement={view.arrangement}
          isHidePreview={view.isHideThumbnailPreview}
          isHideTitle={view.isHideThumbnailTitle}
          density={1}
          isDraggable={true}
          accessPoint={ResourceAccessPoint.COLLECTION}
          accessPointId={collection.id}
          isApplyCustomColor={dev_isRenderColors && group.color}
          visibleProps={$collection.properties?.filter((x) =>
            view.properties?.some(resourceInList(x))
          )}
        />
      {:else}
        <EmptyStatusView size={Size.sm} subText="No items meet this criteria" />
      {/if}
    </div>
  </div>
</CustomColorPropagator>
