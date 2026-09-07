import type {
  AppSkin,
  ColorScheme,
  ColorSchemeSLValues
} from "@21n/theme/appearance.type";
export type AppConstants = {
  themes: AppSkin[];
  colorSchemes: ColorScheme[];
  tempColorSchemes: string[];
  colorSchemeSLConfig: ColorSchemeSLValues[];
};
