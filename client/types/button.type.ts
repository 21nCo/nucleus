import type { Size } from "@21n/types/size.enum";
import type { IKeyboardShortcut } from "@21n/types/shortcut.type";
export enum ButtonStyle {
  DEFAULT = "default",
  PLAIN = "plain",
  OUTLINED = "outlined"
}

export type IButtonParams = {
  label?: string;
  icon?: string;
  tooltip?: string;
  callback?: (event?: any) => Promise<any>;
  action?: string;
  size?: Size.xs | Size.sm | Size.md | Size.lg;
  variant?: ButtonVariant;
  style?: ButtonStyle;
  parentBgIndex?: number;
  shortcut?: string | IKeyboardShortcut;
  isPreventMinWidth?: boolean;
  popoverAction?: any;
  isLoading?: boolean;
  isDisabled?: boolean;
};

export enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  DANGER = "danger",
  SUCCESS = "success"
}

export enum LinkVariant {
  DOTTED = "dotted",
  ARROW = "arrow"
}
