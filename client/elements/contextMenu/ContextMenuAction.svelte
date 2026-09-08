<script lang="ts">
  import type { Snippet } from "svelte";
  import { popover } from "@nucleum/actions/popover.action";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { createEventPropagator } from "@21n/utils/event.utils";
  import view from "@nucleum/stores/view.store";
  import { Placement } from "@21n/elements/direction.enum";
  import {
    type IPopoverRenderBaseParams,
    PopoverTriggerMethod
  } from "@nucleum/actions/popover.type";
  import type { IContextMenuItem } from "@21n/elements/contextMenu/context-menu.type";
  import { Size } from "@21n/elements/size.enum";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import ContextMenu from "@21n/elements/contextMenu/ContextMenu.svelte";
  let {
    id,
    menuResolver,
    size = Size.md,
    actionSize = Size.md,
    actionBgSize = undefined,
    tooltip = undefined,
    tooltipOptions = undefined,
    parentBgIndex = 1,
    triggerMethod = undefined,
    position = undefined,
    offsetInPx = undefined,
    isBoxed = false,
    heading = undefined,
    isPopoverVisible = $bindable(false),
    isRenderAsSibling = false,
    icon = undefined,
    testId = undefined,
    isStopPropagation = false,
    class: className = "",
    onAction = undefined,
    children = undefined
  }: {
    id: string;
    menuResolver: () => { group: string; items: IContextMenuItem[] }[];
    size?: Size.sm | Size.md | Size.lg;
    actionSize?: Size.sm | Size.md | Size.lg;
    actionBgSize?: Size.sm | Size.md | Size.lg | undefined;
    tooltip?: string | undefined;
    tooltipOptions?: IPopoverRenderBaseParams | undefined;
    parentBgIndex?: number;
    triggerMethod?: PopoverTriggerMethod | undefined;
    position?: Placement | undefined;
    offsetInPx?: number | undefined;
    isBoxed?: boolean;
    heading?: string | undefined;
    isPopoverVisible?: boolean;
    isRenderAsSibling?: boolean;
    icon?: string | undefined;
    testId?: string | undefined;
    isStopPropagation?: boolean;
    class?: string;
    onAction?: ((event: CustomEvent<any>) => void) | undefined;
    children?: Snippet | undefined;
  } = $props();
  void tooltipOptions;
  let contextMenuPopoverRef = $state<any>();
  const resolvedIcon = $derived(
    icon ?? ($view.isConstrainedWidth ? "more-outline-horizontal" : "more")
  );

  export function hide() {
    logger.log({ at: "ContextMenuAction - hide" });
    // contextMenuPopoverRef.hide();
    contextMenuPopoverRef.dispatchEvent(new CustomEvent("hide"));
    triggerEventDown("hideSecondaryMenu", {});
  }

  const { setEventContext, getEventContext } =
    createEventPropagator("contextMenuAction");
  setEventContext();

  const { dispatchEvent } = getEventContext();

  function triggerEventDown(event: string, detail: any) {
    dispatchEvent(event, detail);
  }

  function onSelect(item: IContextMenuItem) {
    const actionEvent = new CustomEvent<any>("action", {
      detail: item.value
    });
    onAction?.(actionEvent);
    hide();
  }

  function onPopoverChange(e: Event) {
    isPopoverVisible =
      (e as CustomEvent<{ open?: boolean }>).detail?.open ?? false;
  }
</script>

<button
  aria-label={tooltip ?? heading ?? "Actions"}
  use:popover={{
    placement: position,
    isSpanToTriggerWidth: false,
    isRenderAsModalForCW: $view.isConstrainedWidth,
    offsetInPx,
    content: ContextMenu,
    triggerMethod: triggerMethod
      ? [triggerMethod]
      : [PopoverTriggerMethod.CLICK],
    componentProps: { size, heading, menuResolver, onSelect, parentBgIndex },
    groupId: "contextMenuPopover-" + id,
    id,
    isRenderAsSibling
  }}
  data-testid={testId}
  class={className}
  onclick={(event) => {
    if (isStopPropagation) event.stopPropagation();
  }}
  onchange={onPopoverChange}
  bind:this={contextMenuPopoverRef}
>
  {#if children}
    {@render children?.()}
  {:else}
    <Toggle
      icon={resolvedIcon}
      {tooltip}
      {isBoxed}
      isRenderAsDiv={true}
      isPassive={true}
      parentBgIndex={parentBgIndex + 1}
      isPreventFillOnActive={true}
      size={actionSize}
      bgSize={actionBgSize ?? actionSize}
      bind:on={isPopoverVisible}
    />
  {/if}
</button>
