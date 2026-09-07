

export enum AppSkin {
  Clean = "clean",
  Glassy = "glassy",
  Vibrant = "vibrant",
  Futuristic = "futuristic"
}

export type ColorScheme = {
  label: string;
  theme: string;
  isDark: boolean;
  tailwindSelector: string;
  colors: ColorSchemeColors;
  isExperimental?: boolean;
  isArchived?: boolean;
  isActiveFgFg: boolean;
  isNeverFgFg: boolean;
  id: string;
};

export type ColorSchemeColors = {
  bgs1?: string;
  bgs2?: string;
  bgs3?: string;
  bgs4?: string;
  fgs1?: string;
  fgs2?: string;
  fgs3?: string;
  fgs4?: string;
  aps1?: string;
  aps2?: string;
  aps3?: string;
  ass1?: string;
  ass2?: string;
  ass3?: string;
  ags1?: string;
  ags2?: string;
  ars1?: string;
  ars2?: string;
  brs1?: string;
  brs2?: string;
  brs3?: string;
};

export type ColorSchemeSLValues = {
  saturation: number;
  lightness: number;
  alpha?: number;
  colorScheme: string;
};

export enum ColorStrength {
  ExtraSubtle = "extraSubtle",
  Subtle = "subtle",
  Normal = "normal",
  Strong = "strong",
  ExtraStrong = "extraStrong"
}

export enum ColorType {
  None = "none",
  Background = "background",
  Foreground = "foreground",
  Outline = "outline",
  Border = "border",
  Fill = "fill"
}

export enum Theme {
  LIGHT = "light",
  DARK = "dark"
}

export enum Color {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  /**
   * Foreground color when the element is rendered on active background
   */
  ACTIVE_FG = "ACTIVE_FG",
  FG = "FG",
  FGS2 = "FGS2",
  BG = "BG",
  RED = "RED",
  GREEN = "GREEN",
  CUSTOM = "CUSTOM"
}
