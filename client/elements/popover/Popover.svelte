<script lang="ts">
  import type { Snippet } from "svelte";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { Placement } from "@21n/elements/direction.enum";
  import { GlobalEvent } from "@nucleum/stores/notifications/event.enum";
  import {
    type IPopoverOptions,
    type IPopoverRenderParams,
    PopoverTriggerMethod
  } from "@nucleum/actions/popover.type";
  import {
    dispatchCustomEvent,
    renderPopover
  } from "@21n/utils/browser.utils";
  import { bg, cn } from "@21n/utils/ui.utils";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { onMount } from "svelte";

  const defaultOptions: IPopoverOptions = {
    element: "div",
    class: "",
    id: generateSimpleRandomId(),
    isPreventDefaultStyling: false,
    parentBgIndex: 0,
    placement: Placement.BottomCenter,
    isSpanToTriggerWidth: false,
    offsetInPx: 2,
    isUseAbsolutePositioning: false,
    groupId: undefined,
    isOnlyOneVisiblePerGroup: false
  };

  let {
    placement = Placement.BottomCenter,
    triggerClass = "",
    isPreventDefault = false,
    triggerMethod = PopoverTriggerMethod.CLICK,
    isPreventDefaultStyling = false,
    options = undefined,
    isPopoverVisible = $bindable(false),
    children = undefined,
    popover = undefined,
    onShow = undefined,
    onHide = undefined
  }: {
    placement?: Placement;
    triggerClass?: string;
    isPreventDefault?: boolean;
    triggerMethod?: PopoverTriggerMethod;
    isPreventDefaultStyling?: boolean;
    options?: IPopoverOptions | undefined;
    isPopoverVisible?: boolean;
    children?: Snippet | undefined;
    popover?: Snippet | undefined;
    onShow?: (() => void) | undefined;
    onHide?: (() => void) | undefined;
  } = $props();
  const resolvedOptions = $derived({
    ...defaultOptions,
    ...options,
    id: options?.id ?? defaultOptions.id,
    parentBgIndex: options?.parentBgIndex ?? defaultOptions.parentBgIndex
  });
  let triggerRef = $state<HTMLElement | undefined>();
  let popOverRef = $state<HTMLElement | undefined>();
  const containerId = generateSimpleRandomId();

  onMount(() => {
    window.addEventListener(GlobalEvent.HIDE_POPOVER, hidePopoverListener);
    return () => {
      window.removeEventListener(GlobalEvent.HIDE_POPOVER, hidePopoverListener);
    };
  });

  function hidePopoverListener(e: any) {
    if (!e.detail || e.detail.source === containerId) return;
    if (e.detail.group === resolvedOptions.groupId) hide();
  }

  export function toggle() {
    logger.log({ at: "Popover - toggle", id: resolvedOptions.id });
    if (isPopoverVisible) hide();
    else show();
  }
  export function show() {
    if (!triggerRef || !popOverRef) return;
    const wasVisible = isPopoverVisible;
    if (resolvedOptions.groupId && resolvedOptions.isOnlyOneVisiblePerGroup) {
      dispatchCustomEvent(GlobalEvent.HIDE_POPOVER, {
        group: resolvedOptions.groupId,
        source: containerId
      });
    }
    const config: IPopoverRenderParams = {
      ...resolvedOptions,
      triggerRef,
      popRef: popOverRef,
      placement:
        resolvedOptions.placement ?? placement ?? Placement.BottomCenter
    };
    renderPopover(config);
    if (!isPopoverVisible) isPopoverVisible = true;
    if (!wasVisible) {
      onShow?.();
    }
  }
  export function hide() {
    const wasVisible = isPopoverVisible;
    isPopoverVisible = false;
    if (popOverRef) popOverRef.style.display = "none";
    if (wasVisible) {
      onHide?.();
    }
  }
  export function onPopoverMount(node: HTMLElement) {
    node.style.display = "none";
    return {
      destroy() {}
    };
  }

  function onWindowClick(x: MouseEvent) {
    // logger.log({ at: "Popover - onWindowClick", id: options.id });
    if (!resolvedOptions.id || !isPopoverVisible) return;
    actIfClickedOutside(x, [containerId, resolvedOptions.id], hide);
  }

  /**
   * Checks if the event target is outside the target element and performs the action if true.
   *
   * Note: pop-overlay, input are excluded for the following reasons.
   *
   * pop-overlay is getting triggered when space is pressed on the input field.
   * input is excluded to prevent the action from being triggered when the input field is clicked.
   *
   * @param event the event object
   * @param target the target element
   * @param action the action to be performed
   */
  function actIfClickedOutside(
    event: PointerEvent | MouseEvent,
    target: string | string[],
    action: any
  ) {
    if (!(event.target instanceof Element)) return;
    if (
      event.target.classList.contains("pop-overlay") ||
      event.target.nodeName === "INPUT"
    )
      return;
    const targets = Array.isArray(target) ? target : [target];
    const clickedOutsideAllTargets = targets.every((t) => {
      const nodeTarget = document.querySelector("#" + t);
      return !nodeTarget?.contains(event.target as Node);
    });
    if (clickedOutsideAllTargets) {
      logger.log({
        at: "Popover - actIfClickedOutside - performing action",
        id: resolvedOptions.id,
        target: event.target
      });
      action();
    }
  }
</script>

<button
  id={containerId}
  tabindex="-1"
  data-group-id={resolvedOptions.groupId}
  bind:this={triggerRef}
  onclick={(e) => {
    if (triggerMethod === PopoverTriggerMethod.CLICK && !isPreventDefault) {
      toggle();
    }
    if (isPopoverVisible) e.stopPropagation();
  }}
  oncontextmenu={(e) => {
    if (triggerMethod === PopoverTriggerMethod.RIGHT_CLICK) {
      toggle();
      e.stopPropagation();
      e.preventDefault();
    }
  }}
  class={triggerClass}
>
  {@render children?.()}
</button>
<svelte:element
  this={resolvedOptions.element ?? "div"}
  id={resolvedOptions.id}
  class={cn(
    resolvedOptions.class,
    resolvedOptions.placement,
    bg(resolvedOptions.parentBgIndex ? resolvedOptions.parentBgIndex - 1 : 0),
    {
      "popover shadow-md border border-brs2 rounded-md":
        !isPreventDefaultStyling
    }
  )}
  bind:this={popOverRef}
  use:onPopoverMount
>
  {@render popover?.()}
</svelte:element>
<svelte:window onclick={onWindowClick} />
