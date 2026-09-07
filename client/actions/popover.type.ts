import type { Placement } from "@21n/elements/direction.enum";

export type IPopoverOptions = IPopoverRenderBaseParams & {
  element?: "div" | "button";
  class?: string;
  id?: string;
  isPreventDefaultStyling?: boolean;
  parentBgIndex?: number;
  /**
   * If true, only one popover will be shown at a time with the same .
   */
  isOnlyOneVisiblePerGroup?: boolean;
  groupId?: string;
};

export type IPopoverRenderParams = IPopoverRenderBaseParams & {
  triggerRef: HTMLElement;
  popRef: HTMLElement;
};

export type IPopoverRenderBaseParams = {
  placement?: Placement;
  isSpanToTriggerWidth?: boolean;
  offsetInPx?: number;
  isUseAbsolutePositioning?: boolean;
  isPlaceAtCaret?: boolean;
};

export enum PopoverTriggerMethod {
  CLICK = "click",
  RIGHT_CLICK = "right-click",
  HOVER = "hover",
  NONE = "none",
  SHOW_BY_DEFAULT = "show-by-default"
}
