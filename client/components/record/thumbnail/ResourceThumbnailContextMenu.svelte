<script lang="ts">
  import type { Snippet } from "svelte";
  import ContextMenuAction from "@21n/elements/contextMenu/ContextMenuAction.svelte";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import { Size } from "@21n/types/size.enum";
  import { resolveCollectionContextMenu } from "@nucleum/features/collections/collection.store";
  import { resolveNodeContextMenu } from "@nucleum/features/memory/node/node.store";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type { IRecordId } from "@21n/types/data.type";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { Arrangement, Placement } from "@21n/types/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { resolveObjectiveContextMenu } from "@nucleum/features/focus/goals/goal.store";
  import { resolveTaskContextMenu } from "@nucleum/features/focus/tasks/task.store";
  import context from "@nucleum/stores/context.store";
  import view from "@nucleum/stores/view.store";
  let {
    item = $bindable(),
    accessPoint = ResourceAccessPoint.BROWSER,
    accessPointId = undefined,
    accessPointContext = undefined,
    arrangement = Arrangement.LIST,
    isHidePreview = false,
    isApplyCustomColor = false,
    size = Size.md,
    bgSize = Size.md,
    isInline = false,
    icon = "more",
    isPopoverVisible = $bindable(false),
    onAction = undefined,
    right = undefined,
    class: className = ""
  }: {
    item: any;
    accessPoint?: ResourceAccessPoint;
    accessPointId?: IRecordId | undefined;
    accessPointContext?: string | undefined;
    arrangement?: Arrangement;
    isHidePreview?: boolean;
    isApplyCustomColor?: boolean;
    size?: Size.sm | Size.md | Size.lg;
    bgSize?: Size.sm | Size.md | Size.lg;
    isInline?: boolean;
    icon?: string;
    isPopoverVisible?: boolean;
    onAction?:
      | ((event: CustomEvent<{ action: string; id: string }>) => void)
      | undefined;
    right?: Snippet | undefined;
    class?: string;
  } = $props();
  function handleAction(e: CustomEvent<string>) {
    if (e.detail === "star") item.isStarred = !item.isStarred;
    const actionEvent = new CustomEvent<{ action: string; id: string }>(
      "action",
      { detail: { action: e.detail, id: item.id } }
    );
    onAction?.(actionEvent);
  }
  function resolveContextMenu(item: any, accessPoint: ResourceAccessPoint) {
    const resourceType = determineResourceType(item.id);
    if (resourceType === Resource.node) {
      return resolveNodeContextMenu(item, accessPoint, {
        accessPointId,
        accessPointContext
      });
    } else if (resourceType === Resource.collection) {
      return resolveCollectionContextMenu(item, accessPoint);
    } else if (resourceType === Resource.objective) {
      return resolveObjectiveContextMenu(item, accessPoint);
    } else if (resourceType === Resource.task) {
      return resolveTaskContextMenu(item, accessPoint, { accessPointId });
    } else {
      return [];
    }
  }
</script>

<ContextMenuAction
  id="resourceThumbnailContextMenu"
  testId="thumbnail-context-menu-trigger"
  menuResolver={() => resolveContextMenu(item, accessPoint)}
  bind:isPopoverVisible
  {size}
  actionSize={bgSize ?? size}
  onAction={handleAction}
  position={Placement.BottomCenter}
  isRenderAsSibling={!$view.isConstrainedWidth}
  isStopPropagation={true}
  class={cn(
    "flex gap-2 p--1 z-10",
    {
      "absolute top-0 right-0": !isInline,
      "bg-gradient-to-r from-transparent via-bgs2/90 to-bgs2 rounded-md":
        $context.isTouchDevice,
      "h-full flex-col justify-center": arrangement === Arrangement.LIST
    },
    !isInline &&
      arrangement !== Arrangement.LIST && {
        "border rounded-md": true,
        "m-3": !isHidePreview,
        "m-1": isHidePreview,
        "bg-ccs4 border-ccs2": isApplyCustomColor,
        "bg-bgs2 border-brs3": !isApplyCustomColor
      },
    className
  )}
>
  {#snippet children()}
    <div class="flex">
      {@render right?.()}
      <div
        class={cn(
          !isInline &&
            arrangement === Arrangement.LIST && {
              "mx-2 border rounded-md": arrangement === Arrangement.LIST,
              "bg-ccs4 border-ccs2":
                arrangement === Arrangement.LIST && isApplyCustomColor,
              "bg-bgs2 border-brs3":
                arrangement === Arrangement.LIST && !isApplyCustomColor
            }
        )}
      >
        <Toggle
          {icon}
          isPreventFillOnActive={true}
          size={bgSize ?? size}
          bgSize={bgSize ?? size}
          bind:on={isPopoverVisible}
        />
      </div>
    </div>
  {/snippet}
</ContextMenuAction>
