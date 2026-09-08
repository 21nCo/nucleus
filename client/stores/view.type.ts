import type { Display } from "@21n/elements/display.enum";
import type { IContainer } from "@21n/layout/layout.type";
import type { IAction } from "@nucleum/client/config/action.type";

export type IViewStore = IContainer & {
  scale: number;
  display: Display;
  isMinimalTopBar?: boolean;
  firstLoad: number;
  /**
   * Used in cases like not rendering resources with cantilever buttons on small screens and other places throughout the app to check if the screen width is constrained. This is a proxy for Display.CW or Display.MO
   */
  isConstrainedWidth: boolean;
  /**
   * @deprecated - use appStore.currentPath
   */
  currentPath: string;
  /**
   * @deprecated - use appStore.isMenuHidden
   */
  isMenuHidden: boolean;
  /**
   * @deprecated - use appStore.currentComponent
   */
  currentComponent?: IAction;
  /**
   * @deprecated - use appStore.sheetPath
   */
  sheetPath?: string;
};
