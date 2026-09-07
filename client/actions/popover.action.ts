import {
  mount,
  tick,
  unmount,
  type Component,
  type ComponentType
} from "svelte";
import { Placement } from "@21n/types/direction.enum";
import { PopoverTriggerMethod } from "@21n/types/popover.type";
import { detectTouchDevice, getEventPath } from "@21n/utils/browser.utils";
import { renderMdAsHtml } from "@nucleum/features/memory/markdown/markdown.utils";
import { GlobalEvent } from "@21n/types/event.enum";

interface TooltipReturn {
  update: (newParams: TooltipParams) => void;
  destroy: () => void;
}

interface TooltipParams {
  disabled?: boolean;
  text?: string;
  classList?: string;
  direction?: Placement;
  offsetInPx?: number;
  delay?: number;
  /**
   * If set to true, the tooltip will be enabled only when the text is truncated
   */
  isEnableOnlyOnTruncate?: boolean;
  isLarger?: boolean;
  isAllowTextWrap?: boolean;
}

interface TooltipReturn {
  update: (newParams: TooltipParams) => void;
  destroy: () => void;
}

type TooltipPlacement =
  | Placement.Top
  | Placement.Bottom
  | Placement.Left
  | Placement.Right;

type PopoverComponentConstructor = ComponentType | Component<any>;

function propagateNavEvent(id: string) {
  window.dispatchEvent(
    new CustomEvent(GlobalEvent.EVENT, {
      detail: {
        event: GlobalEvent.NAV,
        value: {
          path: id
        }
      }
    })
  );
}

export function tooltip(
  node: HTMLElement,
  params: TooltipParams
): TooltipReturn {
  const isTouchDevice = detectTouchDevice();
  if (isTouchDevice || "ontouchstart" in window) {
    return {
      update: () => {},
      destroy: () => {}
    };
  }

  let tooltipElement: HTMLDivElement | null = null;
  let {
    text,
    classList = "",
    offsetInPx = 10,
    delay = 300,
    disabled = false,
    isEnableOnlyOnTruncate = false,
    isLarger = false,
    isAllowTextWrap = false
  } = params;
  let direction = normalizeTooltipPlacement(params.direction ?? Placement.Bottom);
  let baseClassList =
    "fixed z-50 px-3 bg-fgs2 text-bgs1 shadow-md rounded-md pointer-events-none opacity-0 transition-opacity duration-200 tooltip";
  if (isAllowTextWrap) {
    baseClassList += " whitespace-normal";
  } else {
    baseClassList += " whitespace-nowrap";
  }
  if (isLarger) {
    baseClassList += " py-2 text-b2 max-w-lg";
  } else {
    baseClassList += " py-1 text-b3 max-w-md";
  }
  let tooltipsContainer = document.getElementById("tooltips");

  function createTooltip(): void {
    if (!text || disabled) return;
    if (isEnableOnlyOnTruncate && node.scrollWidth <= node.clientWidth) return;
    tooltipElement = document.createElement("div");
    tooltipElement.innerHTML = renderMdAsHtml(text);
    tooltipElement.className = `${baseClassList} ${classList}`;
    if (tooltipsContainer) {
      tooltipsContainer.appendChild(tooltipElement);
    } else {
      node.appendChild(tooltipElement);
    }
  }

  function positionTooltip(): void {
    if (!tooltipElement) return;

    const rect = node.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let left = 0;
    let top = 0;
    let actualDirection = direction;

    function calculatePosition(dir: TooltipPlacement): {
      left: number;
      top: number;
      fits: boolean;
    } {
      switch (dir) {
        case Placement.Top:
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          top = rect.top - tooltipRect.height - offsetInPx;
          return {
            left,
            top,
            fits:
              top >= 0 &&
              left >= 0 &&
              left + tooltipRect.width <= window.innerWidth
          };
        case Placement.Bottom:
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          top = rect.bottom + offsetInPx;
          return {
            left,
            top,
            fits:
              top + tooltipRect.height <= window.innerHeight &&
              left >= 0 &&
              left + tooltipRect.width <= window.innerWidth
          };
        case Placement.Left:
          left = rect.left - tooltipRect.width - offsetInPx;
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          return {
            left,
            top,
            fits:
              left >= 0 &&
              top >= 0 &&
              top + tooltipRect.height <= window.innerHeight
          };
        case Placement.Right:
          left = rect.right + offsetInPx;
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          return {
            left,
            top,
            fits:
              left + tooltipRect.width <= window.innerWidth &&
              top >= 0 &&
              top + tooltipRect.height <= window.innerHeight
          };
      }
      return { left, top, fits: false };
    }

    let position = calculatePosition(actualDirection);

    if (!position?.fits) {
      const oppositeDirections: Record<TooltipPlacement, TooltipPlacement> = {
        [Placement.Top]: Placement.Bottom,
        [Placement.Bottom]: Placement.Top,
        [Placement.Left]: Placement.Right,
        [Placement.Right]: Placement.Left
      };

      actualDirection = oppositeDirections[actualDirection];
      position = calculatePosition(actualDirection);

      // If opposite direction also doesn't fit, try to adjust within the original direction
      if (!position?.fits) {
        position = calculatePosition(direction);
        if (
          direction === Placement.Top ||
          direction === Placement.Bottom
        ) {
          position.left = Math.max(
            offsetInPx,
            Math.min(
              position.left,
              window.innerWidth - tooltipRect.width - offsetInPx
            )
          );
        } else if (position) {
          position.top = Math.max(
            offsetInPx,
            Math.min(
              position.top,
              window.innerHeight - tooltipRect.height - offsetInPx
            )
          );
        }
      }
    }

    tooltipElement.style.left = `${position?.left}px`;
    tooltipElement.style.top = `${position?.top}px`;
  }

  function showTooltip(): void {
    if (tooltipElement) tooltipElement.style.opacity = "1";
  }

  function hideTooltip(): void {
    if (tooltipElement) tooltipElement.style.opacity = "0";
  }

  function onMouseEnter(): void {
    createTooltip();
    tick().then(() => {
      positionTooltip();
      setTimeout(() => {
        showTooltip();
      }, delay);
    });
  }

  function onMouseLeave(): void {
    if (tooltipElement && tooltipElement.parentNode) {
      tooltipElement.parentNode.removeChild(tooltipElement);
      tooltipElement = null;
    }
    removeAllTraces();
  }

  function removeAllTraces(): void {
    node.querySelectorAll(".tooltip").forEach((el) => {
      el?.parentNode?.removeChild(el);
    });
    if (!tooltipsContainer) return;
    tooltipsContainer.innerHTML = "";
  }

  node.addEventListener("mouseenter", onMouseEnter);
  node.addEventListener("mouseleave", onMouseLeave);

  return {
    update(newParams: TooltipParams): void {
      const {
        text: nextText,
        classList: nextClassList = "",
        direction: nextDirection = Placement.Top,
        offsetInPx: nextOffsetInPx = 10,
        delay: nextDelay = 300,
        disabled: nextDisabled = false,
        isLarger: nextIsLarger = false
      } = newParams;
      text = nextText;
      classList = nextClassList;
      direction = normalizeTooltipPlacement(nextDirection);
      offsetInPx = nextOffsetInPx;
      delay = nextDelay;
      disabled = nextDisabled;
      isLarger = nextIsLarger;
      if (disabled) {
        removeAllTraces();
        return;
      }
      if (tooltipElement) {
        tooltipElement.textContent = text ?? null;
        tooltipElement.className = `${baseClassList} ${classList}`;
        positionTooltip();
      }
    },
    destroy(): void {
      node.removeEventListener("mouseenter", onMouseEnter);
      node.removeEventListener("mouseleave", onMouseLeave);
      if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement?.parentNode?.removeChild(tooltipElement);
        removeAllTraces();
      }
    }
  };
}

function documentDimensions() {
  const body = document.body;
  const html = document.documentElement;

  const documentWidth = Math.max(
    body.scrollWidth,
    body.offsetWidth,
    html.clientWidth,
    html.scrollWidth,
    html.offsetWidth
  );

  const documentHeight = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
  );

  return { documentWidth, documentHeight };
}

function normalizeTooltipPlacement(direction: Placement): TooltipPlacement {
  switch (direction) {
    case Placement.Top:
    case Placement.Bottom:
    case Placement.Left:
    case Placement.Right:
      return direction;
    default:
      return Placement.Top;
  }
}

function resolveRootElementById(
  node: HTMLElement,
  id: string
): HTMLElement | null {
  const root = node.getRootNode();
  if (root instanceof Document || root instanceof ShadowRoot) {
    const element = root.getElementById(id);
    return element instanceof HTMLElement ? element : null;
  }
  return null;
}

type Content = string | HTMLElement | PopoverComponentConstructor;

interface PopoverParams {
  placement?: Placement;
  isSpanToTriggerWidth?: boolean;
  offsetInPx?: number;
  /**
   * If set to true, the popover will be rendered at the bottom of the trigger element for constrained width context
   */
  isRenderAsModalForCW?: boolean;
  cwModalPosition?: Placement.Bottom | Placement.Top;
  content: Content;
  triggerMethod?: PopoverTriggerMethod[];
  componentProps?: Record<string, any>;
  groupId?: string;
  id?: string;
  /**
   * If set to true, the popover will be rendered as a sibling of the trigger element. By default, popovers are rendered in popovers container to avoid z-index issues with other elements in the DOM.
   */
  isRenderAsSibling?: boolean;
  /**
   * When set, the popover will hide when hovering over any DOM element with this class name and will not hide on hovering out of the trigger element
   */
  classForHoverDismissal?: string;
  /**
   * If set to true, the popover will be rendered in the secondary popovers container.
   */
  isSecondary?: boolean;
  /**
   * Delay in milliseconds before showing the popover on hover.
   */
  delay?: number;
}

export function popover(node: HTMLElement, params: PopoverParams) {
  let popoverElement: HTMLElement | null = null;
  let component: Record<string, any> | null = null;
  let {
    placement = Placement.BottomCenter,
    isSpanToTriggerWidth = false,
    offsetInPx = 4,
    isRenderAsModalForCW = false,
    cwModalPosition = Placement.Bottom,
    content,
    triggerMethod = [PopoverTriggerMethod.CLICK],
    componentProps = {},
    groupId = "popover",
    id = "popover",
    isRenderAsSibling = false,
    classForHoverDismissal = "",
    isSecondary = false,
    delay = 0
  } = params;

  let isShown = false;
  let lastTriggeredBy: PopoverTriggerMethod | null = null;
  let popoverContainer =
    document.getElementById("popovers") ??
    resolveRootElementById(node, "popovers");
  let secondaryPopoverContainer =
    document.getElementById("secondary-popovers") ??
    resolveRootElementById(node, "secondary-popovers");
  let cwModalOverlay: HTMLDivElement | null = null;
  let hoverDelay = delay ?? 0;
  let hoverDelayTimeout: number | null = null;

  function clearHoverDelayTimeout() {
    if (hoverDelayTimeout !== null) {
      clearTimeout(hoverDelayTimeout);
      hoverDelayTimeout = null;
    }
  }

  function isHoverOnlyTrigger() {
    return (
      triggerMethod.includes(PopoverTriggerMethod.HOVER) &&
      !triggerMethod.includes(PopoverTriggerMethod.CLICK) &&
      !triggerMethod.includes(PopoverTriggerMethod.RIGHT_CLICK)
    );
  }

  function hideHoverOnlyPopoverOnTriggerClick() {
    if (isHoverOnlyTrigger() && (isShown || popoverElement)) {
      hidePopover("trigger click");
    }
  }

  async function createPopover(): Promise<void> {
    popoverElement = document.createElement("div");
    if (isRenderAsModalForCW && window.innerWidth < 800) {
      popoverElement.className =
        "fixed rounded-t-md overflow-hidden popover cw-modal pb-8 bg-bgs1";
    } else {
      popoverElement.className =
        "fixed shadow-lg rounded-md overflow-hidden popover";
    }
    if (isHoverOnlyTrigger()) {
      popoverElement.classList.add("pointer-events-none");
    }
    popoverElement.style.zIndex = "50";
    popoverElement.id = id;
    popoverElement.setAttribute("data-group-id", groupId);
    const container = isSecondary
      ? secondaryPopoverContainer
      : popoverContainer;
    if (isRenderAsSibling && node.parentNode) {
      node.parentNode.insertBefore(popoverElement, node.nextSibling);
    } else if (container) {
      container.innerHTML = "";
      container?.appendChild(popoverElement);
    }

    if (typeof content === "string") {
      popoverElement.textContent = content;
    } else if (content instanceof HTMLElement) {
      popoverElement.appendChild(content);
    } else if (typeof content === "function") {
      component = mount(content, {
        target: popoverElement,
        props: { ...componentProps, isPopoverContext: true }
      });
    }

    await tick();
  }

  /**
   *
   *
   * For isRenderAsModalForCW, the popover will be rendered at the bottom of the screen as bottom sheet on mobile devices. Removed 12px margin so that the popover takes the entire width to resemble native sheets.
   *
   * @returns
   */
  function positionPopover(): void {
    if (!popoverElement) return;

    const triggerRect = node.getBoundingClientRect();
    popoverElement.style.display = "block";
    popoverElement.style.opacity = "0";

    let popRect = popoverElement.getBoundingClientRect();
    const { documentWidth, documentHeight } = documentDimensions();
    if (isRenderAsModalForCW && window.innerWidth < 800) {
      cwModalOverlay = document.createElement("div");
      cwModalOverlay.className = "fixed inset-0 bg-black bg-opacity-60";
      cwModalOverlay.style.zIndex = "60";
      cwModalOverlay.style.opacity = "0";
      cwModalOverlay.style.transition =
        "opacity 0.2s cubic-bezier(0.23, 1, 0.32, 1)";
      document.body.appendChild(cwModalOverlay);

      // const finalTop = window.innerHeight - popRect.height - 42;
      const finalTop = window.innerHeight - popRect.height;
      popoverElement.style.position = "fixed";
      popoverElement.style.transition =
        "all 0.2s cubic-bezier(0.23, 1, 0.32, 1)";
      popoverElement.style.left = `0px`;
      // popoverElement.style.margin = "12px";
      // popoverElement.style.width = `${documentWidth - 24}px`;
      popoverElement.style.width = "100%";
      popoverElement.style.opacity = "0";
      popoverElement.style.zIndex = "70";

      if (cwModalPosition === Placement.Bottom) {
        popoverElement.style.top = `${window.innerHeight}px`;
        // popoverElement.style.bottom = "auto";
        popoverElement.style.bottom = "0px";
      } else {
        popoverElement.style.top = `-${popRect.height}px`;
        popoverElement.style.bottom = "auto";
      }

      popoverElement.offsetHeight;
      const element = popoverElement;
      requestAnimationFrame(() => {
        if (element) {
          if (cwModalPosition === Placement.Bottom) {
            element.style.top = `${finalTop}px`;
          } else {
            element.style.top = "60px";
            element.style.height = "fit-content";
          }
          element.style.opacity = "1";
          if (cwModalOverlay) cwModalOverlay.style.opacity = "1";
        }
      });

      const handleOverlayClick = () => {
        hidePopover();
      };
      cwModalOverlay.addEventListener("click", handleOverlayClick);

      return;
    }

    let adjustedPlacement = placement;
    resetPosition();
    adjustIfNotEnoughTop();
    adjustIfNotEnoughBottom();
    adjustIfVerticalSpaceNotEnough();

    if (!isSpanToTriggerWidth) {
      if (
        adjustedPlacement === Placement.Right &&
        documentWidth - triggerRect.right < popRect.width
      ) {
        adjustedPlacement = Placement.Left;
      } else if (
        adjustedPlacement === Placement.Left &&
        triggerRect.left < popRect.width
      ) {
        adjustedPlacement = Placement.Right;
      }

      if (
        adjustedPlacement === Placement.BottomCenter ||
        adjustedPlacement === Placement.TopCenter
      ) {
        if (documentWidth - triggerRect.right < popRect.width / 2) {
          if (adjustedPlacement === Placement.BottomCenter)
            adjustedPlacement = Placement.BottomRight;
          if (adjustedPlacement === Placement.TopCenter)
            adjustedPlacement = Placement.TopRight;
        }
        if (triggerRect.left < popRect.width / 2) {
          if (adjustedPlacement === Placement.BottomCenter)
            adjustedPlacement = Placement.BottomLeft;
          if (adjustedPlacement === Placement.TopCenter)
            adjustedPlacement = Placement.TopLeft;
        }
      }
    }

    if (
      adjustedPlacement === Placement.BottomLeft ||
      adjustedPlacement === Placement.TopLeft
    ) {
      popoverElement.style.left = `${triggerRect.left}px`;
    } else if (
      adjustedPlacement === Placement.BottomRight ||
      adjustedPlacement === Placement.TopRight
    ) {
      popoverElement.style.right = `${documentWidth - triggerRect.right}px`;
    }
    if (
      adjustedPlacement === Placement.TopLeft ||
      adjustedPlacement === Placement.TopRight ||
      adjustedPlacement === Placement.TopCenter
    ) {
      popoverElement.style.bottom = `${documentHeight - triggerRect.top + offsetInPx}px`;
    } else if (
      adjustedPlacement === Placement.BottomLeft ||
      adjustedPlacement === Placement.BottomRight ||
      adjustedPlacement === Placement.BottomCenter
    ) {
      popoverElement.style.top = `${triggerRect.bottom + offsetInPx}px`;
    }

    adjustIfHeightOrWidthAboveDocument();
    popRect = popoverElement.getBoundingClientRect();

    if (adjustedPlacement === Placement.Right) {
      popoverElement.style.left = `${triggerRect.right + offsetInPx}px`;
    } else if (adjustedPlacement === Placement.Left) {
      popoverElement.style.right = `${documentWidth - triggerRect.left + offsetInPx}px`;
    } else if (
      adjustedPlacement === Placement.TopCenter ||
      adjustedPlacement === Placement.BottomCenter
    ) {
      if (isSpanToTriggerWidth) {
        popoverElement.style.left = `${triggerRect.left}px`;
      } else {
        popoverElement.style.left = `${triggerRect.left + triggerRect.width / 2 - popRect.width / 2}px`;
      }
    }

    if (
      adjustedPlacement === Placement.Left ||
      adjustedPlacement === Placement.Right
    ) {
      if (triggerRect.top < popRect.height / 2) {
        popoverElement.style.top = "6px";
      } else if (documentHeight - triggerRect.bottom < popRect.height / 2) {
        popoverElement.style.bottom = "6px";
      } else {
        popoverElement.style.top = `${triggerRect.top + triggerRect.height / 2 - popRect.height / 2}px`;
      }
    }
    popRect = popoverElement.getBoundingClientRect();
    if (popRect.left < 0) {
      popoverElement.style.left = "6px";
      popoverElement.style.right = "";
    } else if (popRect.right > documentWidth) {
      popoverElement.style.right = "6px";
      popoverElement.style.left = "";
    }

    if (isSpanToTriggerWidth)
      popoverElement.style.width = `${triggerRect.width}px`;
    popoverElement.style.opacity = "1";

    function resetPosition(): void {
      if (!popoverElement) return;
      popoverElement.style.left = "";
      popoverElement.style.top = "";
      popoverElement.style.right = "";
      popoverElement.style.bottom = "";
    }

    /**
     * Adjusts the placement if the top space is not enough
     */
    function adjustIfNotEnoughTop(): void {
      if (
        !(
          [Placement.TopLeft, Placement.TopRight, Placement.TopCenter].includes(
            placement
          ) &&
          triggerRect.top < popRect.height &&
          documentHeight - triggerRect.bottom >= popRect.height
        )
      ) {
        return;
      }
      switch (placement) {
        case Placement.TopLeft:
          adjustedPlacement = Placement.BottomLeft;
          break;
        case Placement.TopRight:
          adjustedPlacement = Placement.BottomRight;
          break;
        case Placement.TopCenter:
          adjustedPlacement = Placement.BottomCenter;
          break;
      }
    }

    /**
     * Adjusts the placement if the bottom space is not enough
     */
    function adjustIfNotEnoughBottom(): void {
      if (
        !(
          [
            Placement.BottomLeft,
            Placement.BottomRight,
            Placement.BottomCenter
          ].includes(placement) &&
          documentHeight - triggerRect.bottom < popRect.height &&
          triggerRect.top >= popRect.height
        )
      ) {
        return;
      }
      switch (placement) {
        case Placement.BottomCenter:
          adjustedPlacement = Placement.TopCenter;
          break;
        case Placement.BottomLeft:
          adjustedPlacement = Placement.TopLeft;
          break;
        case Placement.BottomRight:
          adjustedPlacement = Placement.TopRight;
          break;
      }
    }

    /**
     * Adjusts the placement if the vertical space is not enough
     *
     * Ignores if `isSpanToTriggerWidth` is true as this should render either on top or bottom of the trigger element and spanning to the width of the trigger element
     */
    function adjustIfVerticalSpaceNotEnough(): void {
      if (
        ![
          Placement.TopLeft,
          Placement.TopRight,
          Placement.TopCenter,
          Placement.BottomCenter,
          Placement.BottomLeft,
          Placement.BottomRight
        ].includes(placement)
      ) {
        return;
      }
      if (
        triggerRect.top < popRect.height &&
        documentHeight - triggerRect.bottom < popRect.height
      ) {
        if (documentWidth - triggerRect.right >= popRect.width)
          adjustedPlacement = Placement.Right;
        else if (triggerRect.left >= popRect.width)
          adjustedPlacement = Placement.Left;
      }
    }

    function adjustIfHeightOrWidthAboveDocument(): void {
      if (!popoverElement) return;
      if (popRect.width > documentWidth) {
        popoverElement.style.width = `${documentWidth - 12}px`;
      }
      if (popRect.height > documentHeight) {
        popoverElement.style.height = `${documentHeight - 12}px`;
      }
    }
  }

  async function showPopover(e?: any): Promise<void> {
    try {
      clearHoverDelayTimeout();
      if (popoverElement && !popoverElement.isConnected) {
        popoverElement = null;
        if (component) {
          void unmount(component);
          component = null;
        }
      }
      if (!popoverElement) await createPopover();
      positionPopover();
      isShown = true;
      triggerChangeEvent();
      document.addEventListener("click", handleOutsideClickv2);
    } catch (e) {
      console.error("showPopover", e);
    }
  }

  function hidePopover(e?: any): void {
    // console.log("hidePopover", e);
    clearHoverDelayTimeout();
    if (popoverElement) {
      try {
        if (typeof popoverElement.remove === "function") {
          popoverElement.remove();
        } else if (popoverElement.parentNode) {
          popoverElement.parentNode.removeChild(popoverElement);
        }
      } catch (e) {
        console.error("hidePopover", e);
      }
      popoverElement = null;
      if (component) {
        void unmount(component);
        component = null;
      }
    }
    if (cwModalOverlay) {
      cwModalOverlay.style.opacity = "0";
      cwModalOverlay.remove();
      propagateNavEvent("popover");
    }
    isShown = false;
    triggerChangeEvent();
    document.removeEventListener("click", handleOutsideClickv2);
  }

  function triggerChangeEvent(): void {
    const event = new CustomEvent("change", {
      detail: { open: isShown }
    });
    node.dispatchEvent(event);
  }

  function handleOutsideClick(event: MouseEvent): void {
    if (
      popoverElement &&
      !popoverElement.contains(event.target as Node) &&
      !node.contains(event.target as Node)
    ) {
      hidePopover("outside click");
    }
  }

  /**
   *
   *
   * Temp disabling svg and path click handling - unable to reliably detect for svg elements
   *
   * @param event
   * @returns
   */
  function handleOutsideClickv2(event: MouseEvent): void {
    const targetNode = event.target;
    if (
      !popoverElement ||
      !node ||
      !(targetNode instanceof Node) ||
      targetNode.nodeName === "PLASMO-CSUI"
    )
      return;

    const target =
      targetNode instanceof Element ? targetNode : targetNode.parentElement;
    if (!target) return;
    const path = event.composedPath?.() ?? getEventPath(event);
    if (target.tagName.toLowerCase() === "path") {
      const svgParent = target.closest("svg");
      // console.log("svgParent", path, svgParent);
      if (svgParent) {
        if (node.contains(svgParent) || popoverElement.contains(svgParent)) {
          return;
        }
      } else if (path) {
        const isInsideNodeOrPopover = path.some(
          (element) =>
            element instanceof SVGElement ||
            (element instanceof Node &&
              (node.contains(element) ||
                popoverElement?.contains(element)))
        );
        if (isInsideNodeOrPopover) {
          return;
        }
      }
    }

    if (
      !popoverElement.contains(target) &&
      !node.contains(target) &&
      !target.getAttribute("data-popover-id") &&
      target.tagName.toLowerCase() !== "path" &&
      target.tagName.toLowerCase() !== "svg"
    ) {
      // console.log("hidePopover - outside click", target);
      hidePopover("outside click");
    }
  }

  function handleTrigger(event: MouseEvent | TouchEvent): void {
    if (
      triggerMethod.includes(PopoverTriggerMethod.CLICK) &&
      event.type === "click"
    ) {
      event.preventDefault();
      if (isShown && lastTriggeredBy === PopoverTriggerMethod.CLICK) {
        hidePopover("click");
        lastTriggeredBy = null;
        return;
      } else if (isShown) {
        lastTriggeredBy = PopoverTriggerMethod.CLICK;
      } else if (!isShown) {
        showPopover(event);
        lastTriggeredBy = PopoverTriggerMethod.CLICK;
      }
    } else if (
      triggerMethod.includes(PopoverTriggerMethod.RIGHT_CLICK) &&
      event.type === "contextmenu"
    ) {
      event.preventDefault();
      lastTriggeredBy = PopoverTriggerMethod.RIGHT_CLICK;
      isShown ? hidePopover("right click") : showPopover();
    } else if (
      triggerMethod.includes(PopoverTriggerMethod.HOVER) &&
      event.type === "mouseenter"
    ) {
      clearHoverDelayTimeout();
      if (hoverDelay > 0) {
        hoverDelayTimeout = window.setTimeout(() => {
          showPopover();
          hoverDelayTimeout = null;
        }, hoverDelay);
      } else {
        showPopover();
      }
    } else if (
      triggerMethod.includes(PopoverTriggerMethod.HOVER) &&
      event.type === "mouseleave"
    ) {
      clearHoverDelayTimeout();
      if (
        isShown &&
        !classForHoverDismissal &&
        !(
          triggerMethod.includes(PopoverTriggerMethod.CLICK) &&
          lastTriggeredBy === PopoverTriggerMethod.CLICK
        )
      )
        hidePopover();
    }
  }

  function setupEventListeners(): void {
    if (triggerMethod.includes(PopoverTriggerMethod.HOVER)) {
      node.addEventListener("mouseenter", handleTrigger);
      node.addEventListener("mouseleave", handleTrigger);
    }
    if (triggerMethod.includes(PopoverTriggerMethod.CLICK)) {
      node.addEventListener("click", handleTrigger);
    }
    if (triggerMethod.includes(PopoverTriggerMethod.RIGHT_CLICK)) {
      node.addEventListener("contextmenu", handleTrigger);
    }
    if (isHoverOnlyTrigger()) {
      node.addEventListener("click", hideHoverOnlyPopoverOnTriggerClick);
    }
    node.addEventListener("hide", hidePopover);
    node.addEventListener("show", showPopover);

    if (classForHoverDismissal) {
      document.addEventListener("mouseenter", handleClassHoverDismissal, true);
    }
  }

  function handleClassHoverDismissal(event: MouseEvent): void {
    if (!isShown || !classForHoverDismissal) return;

    const target = event.target as Element;
    if (
      target &&
      target.classList &&
      target.classList.contains(classForHoverDismissal)
    ) {
      hidePopover("class hover dismissal");
    }
  }

  function removeEventListeners(): void {
    if (triggerMethod.includes(PopoverTriggerMethod.HOVER)) {
      node.removeEventListener("mouseenter", handleTrigger);
      node.removeEventListener("mouseleave", handleTrigger);
    }
    if (triggerMethod.includes(PopoverTriggerMethod.CLICK)) {
      node.removeEventListener("click", handleTrigger);
    }
    if (triggerMethod.includes(PopoverTriggerMethod.RIGHT_CLICK)) {
      node.removeEventListener("contextmenu", handleTrigger);
    }
    node.removeEventListener("click", hideHoverOnlyPopoverOnTriggerClick);
    node.removeEventListener("hide", hidePopover);
    node.removeEventListener("show", showPopover);

    if (classForHoverDismissal) {
      document.removeEventListener(
        "mouseenter",
        handleClassHoverDismissal,
        true
      );
    }
    clearHoverDelayTimeout();
  }

  setupEventListeners();
  const actionMap = new WeakMap();
  actionMap.set(node, { show: showPopover, hide: hidePopover });

  if (triggerMethod.includes(PopoverTriggerMethod.SHOW_BY_DEFAULT)) {
    showPopover();
  }

  return {
    update(newParams: PopoverParams): void {
      ({
        placement = Placement.BottomCenter,
        isSpanToTriggerWidth = false,
        offsetInPx = 4,
        content,
        triggerMethod = [PopoverTriggerMethod.CLICK],
        componentProps = {},
        groupId = "popover",
        id = "popover",
        isRenderAsSibling = false,
        isRenderAsModalForCW = false,
        cwModalPosition = Placement.Bottom,
        classForHoverDismissal = "",
        isSecondary = false,
        delay = 0
      } = newParams);
      hoverDelay = delay ?? 0;
      //TODO - troubleshoot the root casue. Temporary fix added for date picker popover when rendered as bottom on mobile is adding many overlays on update trigger.
      if (popoverElement && !isRenderAsModalForCW) {
        positionPopover();
      }
    },
    destroy(): void {
      removeEventListeners();
      hidePopover("destroy");
    }
  };
}

export { PopoverTriggerMethod as TriggerMethod };
