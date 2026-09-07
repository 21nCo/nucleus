<script lang="ts">
  import { Arrangement } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import ResourceGridThumbnail from "@nucleum/components/records/ResourceGridThumbnail.svelte";
  import ResourceThumbnailBase from "@nucleum/application/record/thumbnail/ResourceThumbnailBase.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { type IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import type { IProperty } from "@nucleum/features/collections/properties/property.type";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import {
    activeSession,
    currentFocusItem
  } from "@nucleum/features/focus/session.store";

  import ObjectiveThumbnailSub from "@nucleum/features/focus/goals/thumbnail/GoalThumbnailSub.svelte";
  import ObjectiveThumbnailTitle from "@nucleum/features/focus/goals/thumbnail/GoalThumbnailTitle.svelte";
  import FocusItemPickOverlay from "@nucleum/features/focus/elements/focusitem/FocusItemPickOverlay.svelte";
  import { resolveObjectiveColor } from "@nucleum/features/focus/goals/goal.utils";
  import CollectionItemThumbnailProperties from "@nucleum/features/collections/properties/CollectionItemThumbnailProperties.svelte";

  let {
    item: initialItem,
    arrangement = Arrangement.LIST,
    size = Size.md,
    accessPoint = ResourceAccessPoint.BROWSER,
    accessPointId,
    isApplyCustomColor = false,
    isDraggable = false,
    visibleProps = [],
    refreshId: initialRefreshId = new Date().getTime(),
    onClick = undefined
  }: {
    item: IObjectiveThumb;
    arrangement?: Arrangement;
    size?: Size.sm | Size.md;
    accessPoint?: ResourceAccessPoint;
    accessPointId: string;
    isApplyCustomColor?: boolean;
    isDraggable?: boolean;
    visibleProps?: IProperty[];
    refreshId?: number;
    onClick?: ((event: MouseEvent) => void) | undefined;
  } = $props();

  let item = $state(initialItem);
  let refreshId = $state(initialRefreshId);
  let isHovering = $state(false);
  void size;
  const color = $derived(resolveObjectiveColor(item));
  const isCurrentlyFocusing = $derived(
    activeSession.isCurrentFocusItem(item.id, $currentFocusItem)
  );

  $effect(() => {
    item = initialItem;
    refreshId = new Date().getTime();
  });
</script>

<ResourceThumbnailBase
  bind:item
  {accessPoint}
  {accessPointId}
  {isDraggable}
  {isApplyCustomColor}
  {arrangement}
  isHidePreview={true}
  bind:isHovering
>
  <CustomColorPropagator {color}>
    {#if arrangement === Arrangement.LIST}
      <div
        class={cn(
          "relative flex flex-col w-full border rounded-md truncate",
          {
            "bg-ccs4 border border-ccs1": isCurrentlyFocusing
          },
          !isCurrentlyFocusing && {
            "bg-ccs5 notouch:hover:bg-ccs4 active:bg-ccs4 border-ccs2":
              isApplyCustomColor,
            "border-transparent notouch:hover:border-brs3 active:border-brs3 px-1":
              !isApplyCustomColor,
            "bg-bgs2 px-2": !isApplyCustomColor
          }
        )}
      >
        <button
          class={cn(
            "flex w-full items-center truncate",
            visibleProps.length === 0 && "h-16"
          )}
          onclick={onClick}
        >
          <div class="flex flex-col gap-1 p-3 w-full">
            <ObjectiveThumbnailTitle {item} {isCurrentlyFocusing} {color} />
            <ObjectiveThumbnailSub {item} {isCurrentlyFocusing} {accessPoint} />
            {#if visibleProps.length > 0}
              <div class="py-1">
                <CollectionItemThumbnailProperties
                  values={item.propertyValues}
                  properties={visibleProps}
                  {item}
                  {accessPoint}
                />
              </div>
            {/if}
          </div>
          {#if accessPoint === ResourceAccessPoint.PICKER}
            <FocusItemPickOverlay {isHovering} {item} />
          {/if}
        </button>
      </div>
    {:else if arrangement === Arrangement.GRID}
      <ResourceGridThumbnail
        {item}
        onclick={onClick}
        {isApplyCustomColor}
        {size}
        isHidePreview={true}
      >
        {#snippet bottom()}
          <div class="flex flex-col w-full min-h-12">
            <div class="flex flex-col gap-2">
              <ObjectiveThumbnailTitle {item} {isCurrentlyFocusing} {color} />
              <ObjectiveThumbnailSub {item} {isCurrentlyFocusing} {accessPoint} />
              {#if visibleProps.length > 0}
                <CollectionItemThumbnailProperties
                  values={item.propertyValues}
                  properties={visibleProps}
                  {item}
                  {accessPoint}
                />
              {/if}
            </div>
          </div>
        {/snippet}
      </ResourceGridThumbnail>
    {/if}
  </CustomColorPropagator>
</ResourceThumbnailBase>
