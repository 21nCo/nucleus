import { ColorStrength, type ColorSchemeSLValues } from "@21n/theme/appearance.type";
import { type AppearanceStore } from "@nucleum/stores/appearance.type";

const selectableColorParams: ColorSchemeSLValues[] = [
  {
    saturation: 55,
    lightness: 65,
    colorScheme: "colorscheme:solarizeddark"
  }
];

export function resolveSaturationAndLightness(appearance: AppearanceStore) {
  let saturation = 75;
  let lightness = 55;
  if (!appearance || !appearance.colorScheme) return { saturation, lightness };
  let config = selectableColorParams.find(
    (x: ColorSchemeSLValues) => x.colorScheme === appearance.colorScheme.id
  );
  if (config) {
    saturation = config.saturation;
    lightness = config.lightness;
  }
  return { saturation, lightness };
}
export function retrieveCurrentColors(appearance: AppearanceStore) {
  let colorScheme = appearance.colorScheme.colors;
  return colorScheme;
}

export function generateCustomColorShade(
  appearance: AppearanceStore,
  hue: number,
  shade: number = 1
) {
  let color: string;
  let saturation: number = 50;
  let lightness: number = 50;
  let values = resolveSaturationAndLightness(appearance);
  if (values) {
    saturation = values.saturation;
    lightness = values.lightness;
  }
  if (shade === 1) {
    lightness = appearance.colorScheme.isDark ? 25 : 80;
  } else if (shade === 2) {
    lightness = appearance.colorScheme.isDark ? 20 : 85;
  } else if (shade === 3) {
    lightness = appearance.colorScheme.isDark ? 15 : 92;
  } else if (shade === 4) {
    lightness = appearance.colorScheme.isDark ? 10 : 98;
  }
  color = `hsl(${hue} ${saturation}% ${lightness}% / 1)`;
  return color;
}

/**
 * Generates custom color shades based on theme settings
 * @param appearance
 * @param fallback
 * @param hue
 * @param shade
 * @returns
 */
export function generateCustomColorShades(
  appearance: AppearanceStore,
  hue: number
) {
  return [0, 1, 2, 3, 4].map((shade) => {
    return generateCustomColorShade(appearance, hue, shade);
  });
}

/**
 * Use only to access custom color programatically. Use CustomColorPropagator.svelte for rendering custom colors in markup
 * @param appearance
 * @param fallback
 * @param hue
 * @returns
 */
export function customColor(appearance: AppearanceStore, hue: number) {
  let color: string;
  let saturation: number = 50;
  let lightness: number = 50;
  let values = resolveSaturationAndLightness(appearance);
  if (values) {
    saturation = values.saturation;
    lightness = values.lightness;
  }
  color = `hsl(${hue} ${saturation}% ${lightness}%)`;
  return color;
}

/**
 * @deprecated - use text-abg class instead if it is accent bg
 * @param appearance
 * @param textColorStrength
 * @param isAccentBgActive
 * @param bgColorHue
 * @returns
 */
export function textColorClass(
  appearance: AppearanceStore,
  textColorStrength: ColorStrength = ColorStrength.Normal,
  isAccentBgActive: boolean = false,
  bgColorHue: number | undefined = undefined
) {
  const isActiveFgFg = resolveIfActiveFgFg(bgColorHue, appearance);
  if ((isAccentBgActive && isActiveFgFg) || !isAccentBgActive) {
    switch (textColorStrength) {
      case ColorStrength.ExtraSubtle:
        return "text-fgs3";
      case ColorStrength.Subtle:
        return "text-fgs2";
      case ColorStrength.Normal:
        return "text-fgs1";
      case ColorStrength.Strong:
        return "text-fgs1";
      case ColorStrength.ExtraStrong:
        return "text-fgs1";
      default:
        return "text-fgs2";
    }
  } else {
    switch (textColorStrength) {
      case ColorStrength.ExtraSubtle:
        return "text-bgs3";
      case ColorStrength.Subtle:
        return "text-bgs2";
      case ColorStrength.Normal:
        return "text-bgs1";
      case ColorStrength.Strong:
        return "text-bgs1";
      case ColorStrength.ExtraStrong:
        return "text-bgs1";
      default:
        return "text-bgs2";
    }
  }
}

/**
 * @deprecated - use bg(), abg() utils from ui.utils.ts
 * @param appearance
 * @param parentBackgroundIndex
 * @returns
 */
export function resolveBackgroundClass(
  appearance: AppearanceStore,
  parentBackgroundIndex: number = 1
) {
  let activeBackgroundColor;
  let backgroundColor;
  let activeBackgroundColorHex;
  let backgroundColorHex;
  let currentColors = retrieveCurrentColors(appearance);
  if (parentBackgroundIndex === 1) {
    activeBackgroundColor = "bg-bgs3";
    activeBackgroundColorHex = currentColors?.bgs3;
    backgroundColor = "bg-bgs2";
    backgroundColorHex = currentColors?.bgs2;
  } else if (parentBackgroundIndex === 2) {
    activeBackgroundColor = "bg-bgs4";
    activeBackgroundColorHex = currentColors?.bgs4;
    backgroundColor = "bg-bgs3";
    backgroundColorHex = currentColors?.bgs3;
  } else if (parentBackgroundIndex === 3) {
    activeBackgroundColor = "bg-bgs4";
    activeBackgroundColorHex = currentColors?.bgs4;
    backgroundColor = "bg-bgs4";
    backgroundColorHex = currentColors?.bgs4;
  } else {
    activeBackgroundColor = "bg-bgs2";
    activeBackgroundColorHex = currentColors?.bgs2;
    backgroundColor = "bg-bgs1";
    backgroundColorHex = currentColors?.bgs1;
  }
  return {
    activeBackgroundColor,
    backgroundColor,
    activeBackgroundColorHex,
    backgroundColorHex
  };
}
/**
 * Determines if the foreground color of text or icons should be Fg shades or not
 * @param bgColorHue 0-360 for custom hue or -1 for default bg of the app or undefined if the custom color is not present
 * @param appearance user preferences
 * @returns true if the foreground color of text or icons should be Fg shades or not
 */
export function resolveIfActiveFgFg(
  bgColorHue: number | undefined,
  appearance: AppearanceStore
) {
  if (!appearance.colorScheme) return false;
  if (
    "isNeverFgFg" in appearance.colorScheme &&
    appearance.colorScheme.isNeverFgFg
  ) {
    return false;
  } else if (bgColorHue === -1 || !bgColorHue) {
    return appearance.colorScheme.isActiveFgFg;
  } else if (bgColorHue >= 45 && bgColorHue <= 180) {
    return !appearance.colorScheme.isDark;
  } else {
    return appearance.colorScheme.isDark;
  }
}

export function heatMapColorRange(
  appearance: AppearanceStore,
  fallback: string,
  numberOfColors: number,
  hue: number | undefined = undefined
) {
  let colors: string[];
  let saturation: number = 50;
  let lightness: number = 50;
  const currentColors = retrieveCurrentColors(appearance);
  if (hue === undefined || hue === null || typeof hue !== "number") {
    const color = currentColors[fallback as keyof typeof currentColors];
    if (!color) return [];
    hue = Number(color.split(" ")[0].split("(")[1]);
    saturation = Number(color.split(" ")[1].split("%")[0]);
    lightness = Number(color.split(" ")[2].split("%")[0]);
  } else {
    let values = resolveSaturationAndLightness(appearance);
    if (values) {
      saturation = values.saturation;
      lightness = values.lightness;
    }
  }
  colors = Array.from({ length: numberOfColors }, (_, i) => {
    const s = +saturation - i * (appearance.colorScheme.isDark ? 4 : 8);
    const l = +lightness + i * (appearance.colorScheme.isDark ? 4 : 6);
    return `hsl(${hue} ${s}% ${l}%)`;
  });
  const backgroundColor = currentColors["bgs2"];
  if (backgroundColor) colors.push(backgroundColor);
  return colors.reverse();
}
