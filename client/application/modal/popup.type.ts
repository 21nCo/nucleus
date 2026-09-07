import type { IButtonParams } from "@21n/elements/button/button.type";
import type { Orientation, Placement } from "@21n/elements/direction.enum";
import type { Size } from "@21n/elements/size.enum";

export type ModalEvent = ModalParams & {
  path: string;
  isShow: boolean;
};
/**
 * @description
 *
 * ModalParams is a type that defines the parameters for a modal
 * isDismissable: if true, the modal can be dismissed by clicking outside of the modal
 * title: title of the modal
 *
 */
export type ModalParams = {
  isShowAsSheet?: boolean;
  isDismissable?: boolean;
  /**
   * If set to false, the modal will have a transparent background and will have a shadow.
   */
  isShowOverlay?: boolean;
  title?: string;
  componentParams?: any;
  layout?: ModalLayoutParams;
  /**
   * @deprecated - use layout.alignment instead
   */
  isOnRight?: boolean;
};

export type ModalLayoutParams = {
  size?: Size;
  isDynamicSize?: boolean;
  orientation?: Orientation;
  primaryAction?: IButtonParams;
  secondaryAction?: IButtonParams;
  ignoreSafeArea?: boolean;
  isShowClose?: boolean;
  isShowCantileverClose?: boolean;
  isShowBackButton?: boolean;
  /**
   * If set to true, padding will be ignored for modal content area. Therefore, the component should make use of ModalContentPadded for the content.
   */
  isOveriddenFooter?: boolean;
  /**
   * Top: The modal will be aligned on the top of the screen with a margin instead of the default center aligned.
   */
  alignment?:
    | Placement.Center
    | Placement.TopCenter
    | Placement.BottomCenter
    | Placement.Right;
};

export type IPlayer = {
  action?: string;
  isMiniOn: boolean;
  isPipOn: boolean;
};
