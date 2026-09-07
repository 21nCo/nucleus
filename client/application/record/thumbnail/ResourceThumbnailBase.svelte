<script lang="ts">
  import type { Snippet } from "svelte";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import {
    determineResourceType,
    resolveBulkSelectionAccessPointId,
    resourceIdToElementId,
    resourceInList,
    isSameResource
  } from "@nucleum/datafn/resource.utils";
  import { bulkEditStore } from "@nucleum/stores/resources/bulkedit.store";
  import Check from "@21n/icons/Check.svelte";
  import context from "@nucleum/stores/context.store";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { Arrangement } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import ResourceThumbnailContextMenu from "@nucleum/application/record/thumbnail/ResourceThumbnailContextMenu.svelte";
  import { stringify } from "@21n/shared-utils/json.utils";

  let {
    isHovering = $bindable(false),
    item: itemProp = $bindable(),
    isDraggable = false,
    accessPoint = ResourceAccessPoint.BROWSER,
    accessPointContext = undefined,
    arrangement = Arrangement.LIST,
    isHidePreview = false,
    isApplyCustomColor = false,
    accessPointId = undefined,
    isPreventDefaultContextMenu = false,
    isAlwaysShowContextMenuOnTouchDevice = false,
    children,
    right,
    onAction = undefined,
    onClick = undefined
  }: {
    isHovering?: boolean;
    item: any;
    isDraggable?: boolean;
    accessPoint?: ResourceAccessPoint;
    accessPointContext?: string | undefined;
    arrangement?: Arrangement;
    isHidePreview?: boolean;
    isApplyCustomColor?: boolean;
    accessPointId?: IRecordId | undefined;
    isPreventDefaultContextMenu?: boolean;
    isAlwaysShowContextMenuOnTouchDevice?: boolean;
    children?: Snippet;
    right?: Snippet;
    onAction?:
      | ((event: CustomEvent<{ action: string; id: string }>) => void)
      | undefined;
    onClick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
  let item = $state(itemProp);
  let isLocalHovering = $state(false);
  let multiSelectContext = $derived({
    resource: determineResourceType(item.id),
    accessPoint,
    accessPointId: resolveBulkSelectionAccessPointId(accessPoint, accessPointId)
  });
  let isSelected = $state(false);
  let hasSelection = $state(false);
  let isContextMenuVisible = $state(false);
  let currentSelectionCount = $derived($bulkEditStore?.length ?? 0);
  let canShowContextMenu = $derived(
    accessPoint !== ResourceAccessPoint.PICKER &&
      accessPoint !== ResourceAccessPoint.MAP &&
      !isPreventDefaultContextMenu
  );
  let isContextMenuInteractive = $derived(
    isLocalHovering ||
      isHovering ||
      (isAlwaysShowContextMenuOnTouchDevice && $context.isTouchDevice)
  );
  let shouldRenderContextMenu = $derived(
    canShowContextMenu && (isContextMenuInteractive || isContextMenuVisible)
  );

  $effect(() => {
    item = itemProp;
  });

  $effect(() => {
    currentSelectionCount;
    const state = bulkEditStore.getState();
    if (
      state.context &&
      stringify(state.context, { isPreventReplacer: true }) ===
        stringify(multiSelectContext, { isPreventReplacer: true })
    ) {
      isSelected = state.selectedIds.some(resourceInList(item.id));
      hasSelection = state.selectedIds.length > 0;
    } else {
      isSelected = false;
      hasSelection = false;
    }
  });

  function toggleSelection(shouldSelect: boolean) {
    const state = bulkEditStore.getState();
    if (
      !state.context ||
      stringify(state.context, { isPreventReplacer: true }) !==
        stringify(multiSelectContext, { isPreventReplacer: true })
    ) {
      return;
    }
    if (shouldSelect) {
      if (!state.selectedIds.some(resourceInList(item.id))) {
        bulkEditStore.select([...state.selectedIds, item.id]);
      }
      return;
    }
    if (state.selectedIds.some(resourceInList(item.id))) {
      bulkEditStore.select(
        state.selectedIds.filter(
          (selection) => !isSameResource(selection, item.id)
        )
      );
    }
  }
</script>

<div
  class={cn("relative flex flex-col w-full resource group/resource-thumbnail", {
    "h-full": arrangement === Arrangement.MASONRY
  })}
  data-testid={`resource-thumbnail:${item.id}`}
  id={resourceIdToElementId("thumbnail", item.id, accessPoint, accessPointId)}
  data-id={item.id}
  draggable={isDraggable}
  onclick={onClick}
  use:hoverable={{
    onHover: (e) => {
      isLocalHovering = e;
      isHovering = e;
    }
  }}
>
  {@render children?.()}
  {#if isSelected || hasSelection}
    <button
      aria-label={isSelected
        ? `Deselect ${item.label || "resource"}`
        : `Select ${item.label || "resource"}`}
      data-testid={`resource-selection-toggle:${item.id}`}
      class="absolute inset-x-0 top-0 w-6 h-6 gap-2 bg-bgs2 border border-brs3 rounded-full m-2 flex items-center justify-center"
      onclick={(event) => event.stopPropagation()}
    >
      {#if isSelected}
        <Check
          isChecked={true}
          isRounded={true}
          size={Size.lg}
          onclick={() => {
            toggleSelection(false);
          }}
        />
      {:else if hasSelection}
        <Check
          isChecked={false}
          isRounded={true}
          size={Size.lg}
          onclick={() => {
            toggleSelection(true);
          }}
        />
      {/if}
    </button>
  {/if}
  {#if shouldRenderContextMenu}
    <ResourceThumbnailContextMenu
      bind:item
      bind:isPopoverVisible={isContextMenuVisible}
      {accessPoint}
      {accessPointId}
      {accessPointContext}
      {arrangement}
      {isHidePreview}
      {isApplyCustomColor}
      {onAction}
      {right}
      class={cn(
        "transition-opacity",
        isContextMenuInteractive
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none group-hover/resource-thumbnail:opacity-100 group-hover/resource-thumbnail:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto"
      )}
    ></ResourceThumbnailContextMenu>
  {/if}
</div>
