export enum SwitcherStyle {
  Default,
  Vertical,
  Horizontal,
  HorizontalAndWraps
}

export enum PanelSwitcherStyle {
  BAR,
  TRAIN,
  SNAKE
}

export enum SelectionItemActiveStyle {
  UNKNOWN,
  NONE,
  CIRCLE_WITH_BACKGROUND,
  CIRCLE,
  SIDEBAR,
  SIDEDOT,
  BOTTOMDOT,
  BOTTOMBAR,
  ACCENT_BACKGROUND,
  ACCENTROUNDEDBACKGROUND,
  ACCENT_COLOR,
  BG_COLOR
}

export enum VerticalSwitcherStyle {
  BAR,
  GRADIENT,
  DOT,
  BG,
  BAR_V2
}

/**
 * @deprecated
 * Use SelectItem instead
 */
export type SwitchItem = {
  label: string;
  icon?: string;
  isDisabled?: boolean;
};

export enum BarStyle {
  DOT = "DOT",
  UNDER = "UNDER",
  EXACT = "EXACT",
  OVERFLOW = "OVERFLOW"
}

export enum PanelSwitcherActiveItemStrength {
  DEFAULT,
  SUBTLE,
  STRONG
}

export type PanelSwitcherEditModeOptions = {
  removeTooltip?: string;
  addText?: string;
};
