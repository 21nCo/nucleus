import type { IToolTipOptions } from "@21n/elements/text/text.type";
import { Placement } from "@21n/elements/direction.enum";
import { renderPopover, resolveHoverState } from "@21n/utils/browser.utils";

interface HoverableParams {
  tooltip?: string;
  tooltipOptions?: IToolTipOptions;
  isDisabled?: boolean;
  onHover?: (isHovered: boolean) => void;
}

export function hoverable(node: HTMLElement, params: HoverableParams = {}) {
  let toolTipRef: HTMLDivElement;
  let toolTipTimeout: number;
  let isHovered = false;
  let isDestroyed = false;

  const defaultTooltipOptions: IToolTipOptions = {
    placement: Placement.BottomCenter,
    offsetInPx: 4,
    isSpanToTriggerWidth: false,
    isUseAbsolutePositioning: false,
    delay: 800
  };

  const options = { ...defaultTooltipOptions, ...params.tooltipOptions };

  function createTooltip() {
    toolTipRef = document.createElement("div");
    toolTipRef.innerHTML = `<div class="tooltip">${params.tooltip}</div>`;
    toolTipRef.style.display = "none";
    document.body.appendChild(toolTipRef);
  }

  function toggleHoveringState(event: MouseEvent | FocusEvent) {
    if (params.isDisabled) return;

    const newIsHovered = resolveHoverState(event);
    if (newIsHovered !== isHovered) {
      isHovered = newIsHovered;
      node.dispatchEvent(new CustomEvent("hover", { detail: isHovered }));

      if (params.onHover) {
        const onHover = params.onHover;
        const hoverState = isHovered;
        queueMicrotask(() => {
          if (!isDestroyed) onHover(hoverState);
        });
      }
    }

    if (isHovered && params.tooltip) {
      if (toolTipTimeout) clearTimeout(toolTipTimeout);
      if (!toolTipRef) createTooltip();

      toolTipTimeout = window.setTimeout(() => {
        renderPopover({
          triggerRef: node,
          popRef: toolTipRef,
          placement: options.placement,
          offsetInPx: options.offsetInPx,
          isUseAbsolutePositioning: options.isUseAbsolutePositioning
        });
        toolTipRef.style.display = "block";
      }, options.delay);
    } else {
      if (toolTipTimeout) clearTimeout(toolTipTimeout);
      if (toolTipRef) toolTipRef.style.display = "none";
    }
  }

  function handleClick(event: MouseEvent) {
    if (params.isDisabled) return;
    if (toolTipTimeout) clearTimeout(toolTipTimeout);
    if (toolTipRef) toolTipRef.style.display = "none";
  }

  node.addEventListener("mouseover", toggleHoveringState);
  node.addEventListener("mouseleave", toggleHoveringState);
  node.addEventListener("focus", toggleHoveringState);
  node.addEventListener("blur", toggleHoveringState);
  node.addEventListener("click", handleClick);

  return {
    destroy() {
      isDestroyed = true;
      node.removeEventListener("mouseover", toggleHoveringState);
      node.removeEventListener("mouseleave", toggleHoveringState);
      node.removeEventListener("focus", toggleHoveringState);
      node.removeEventListener("blur", toggleHoveringState);
      node.removeEventListener("click", handleClick);
      if (toolTipTimeout) clearTimeout(toolTipTimeout);
      if (toolTipRef) document.body.removeChild(toolTipRef);
    },
    update(newParams: HoverableParams) {
      params = newParams;
    }
  };
}
