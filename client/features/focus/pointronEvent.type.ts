import type { PointronAction } from "@nucleum/features/focus/pointronAction.enum";

/**
 * @deprecated - use IEvent instead
 */
export type IPointronEvent = {
  event: PointronAction;
  value?: boolean | string | PointerEvent | PopupEvent;
};

export type PopupEvent = {
  isShow: boolean;
  id: string;
};
