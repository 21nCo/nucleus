<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import { renderPopover, resolveHoverState } from "@21n/utils/browser.utils";
  import { Placement } from "@21n/elements/direction.enum";
  import Tooltip from "@21n/elements/text/Tooltip.svelte";
  import type { IToolTipOptions } from "@21n/elements/text/text.type";
  let {
    type = "div",
    id = "",
    role = undefined,
    isDisabled = false,
    tooltip = undefined,
    tooltipOptions = {
      placement: Placement.BottomCenter,
      offsetInPx: 4,
      isSpanToTriggerWidth: false,
      isUseAbsolutePositioning: false,
      delay: 400
    },
    isHovering = $bindable(false),
    class: classList = "",
    style: styles = "",
    children,
    onclick,
    onhover,
    onmouseover,
    onmouseleave,
    onfocus,
    onblur,
    oncontextmenu,
    ontouchcancel,
    ontouchend,
    ontouchmove,
    ontouchstart
  }: {
    type?: string;
    id?: string;
    role?: string | undefined;
    isDisabled?: boolean;
    tooltip?: string | undefined;
    tooltipOptions?: IToolTipOptions;
    isHovering?: boolean;
    class?: string;
    style?: string;
    children?: Snippet;
    onclick?: ((event: MouseEvent) => void) | undefined;
    onhover?: ((value: boolean) => void) | undefined;
    onmouseover?: ((event: MouseEvent) => void) | undefined;
    onmouseleave?: ((event: MouseEvent) => void) | undefined;
    onfocus?: ((event: FocusEvent) => void) | undefined;
    onblur?: ((event: FocusEvent) => void) | undefined;
    oncontextmenu?: ((event: MouseEvent) => void) | undefined;
    ontouchcancel?: ((event: TouchEvent) => void) | undefined;
    ontouchend?: ((event: TouchEvent) => void) | undefined;
    ontouchmove?: ((event: TouchEvent) => void) | undefined;
    ontouchstart?: ((event: TouchEvent) => void) | undefined;
  } = $props();
  let toolTipTimeout = $state<any>();
  let triggerRef = $state<HTMLElement>();
  let toolTipRef = $state<HTMLDivElement>();

  onMount(() => {
    if (toolTipRef) hideToolTip();
  });

  const toggleHoveringState = (event: MouseEvent | FocusEvent) => {
    isHovering = resolveHoverState(event);
    onhover?.(isHovering);
    if (isHovering && tooltip) {
      isHovering = true;
      if (toolTipTimeout) clearTimeout(toolTipTimeout);
      if (toolTipRef && triggerRef)
        toolTipTimeout = setTimeout(() => {
          const resolvedTriggerRef = triggerRef;
          const resolvedToolTipRef = toolTipRef;
          if (!resolvedTriggerRef || !resolvedToolTipRef) return;
          renderPopover({
            triggerRef: resolvedTriggerRef,
            popRef: resolvedToolTipRef,
            placement: tooltipOptions.placement ?? Placement.BottomCenter,
            offsetInPx: tooltipOptions.offsetInPx ?? 4,
            isUseAbsolutePositioning:
              tooltipOptions.isUseAbsolutePositioning ?? false
          });
        }, tooltipOptions.delay ?? 400);
    } else {
      if (toolTipTimeout) clearTimeout(toolTipTimeout);
      hideToolTip();
    }
  };
  function hideToolTip() {
    if (toolTipRef) toolTipRef.style.display = "none";
  }
  function handleMouseOver(event: MouseEvent) {
    toggleHoveringState(event);
    onmouseover?.(event);
  }
  function handleMouseLeave(event: MouseEvent) {
    toggleHoveringState(event);
    onmouseleave?.(event);
  }
  function handleFocus(event: FocusEvent) {
    toggleHoveringState(event);
    onfocus?.(event);
  }
  function handleBlur(event: FocusEvent) {
    toggleHoveringState(event);
    onblur?.(event);
  }
  function handleClick(event: MouseEvent) {
    if (toolTipTimeout) clearTimeout(toolTipTimeout);
    if (tooltip) hideToolTip();
    if (isDisabled) return;
    onclick?.(event);
  }
</script>

<svelte:element
  this={type}
  {id}
  role={role ?? (type === "button" ? undefined : "button")}
  tabindex={type === "button" ? undefined : 0}
  bind:this={triggerRef}
  class={classList}
  style={styles}
  onmouseover={handleMouseOver}
  onmouseleave={handleMouseLeave}
  onfocus={handleFocus}
  onblur={handleBlur}
  onclick={handleClick}
  ontouchcancel={ontouchcancel}
  ontouchend={ontouchend}
  ontouchmove={ontouchmove}
  ontouchstart={ontouchstart}
  oncontextmenu={oncontextmenu}
>
  {@render children?.()}
  {#if tooltip}
    <div bind:this={toolTipRef}>
      <Tooltip {tooltip} />
    </div>
  {/if}
</svelte:element>
