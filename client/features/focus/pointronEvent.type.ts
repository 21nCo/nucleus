import type { PointronAction } from "@nucleum/client/config/focus-action.enum";

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
