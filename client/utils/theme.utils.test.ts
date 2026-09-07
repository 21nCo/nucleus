import { describe, expect, it } from "vitest";

import { ColorStrength, Theme } from "@21n/theme/appearance.type";
import { type AppearanceStore } from "@nucleum/stores/appearance.type";

import {
  customColor,
  generateCustomColorShade,
  generateCustomColorShades,
  heatMapColorRange,
  resolveBackgroundClass,
  resolveIfActiveFgFg,
  resolveSaturationAndLightness,
  retrieveCurrentColors,
  textColorClass
} from "./theme.utils";

const appearance: AppearanceStore = {
  id: "appearance",
  theme: Theme.LIGHT,
  colorScheme: {
    id: "colorscheme:solarizeddark",
    label: "Solarized",
    theme: "custom",
    isDark: false,
    tailwindSelector: "",
    colors: {
      bgs1: "hsl(200 40% 20%)",
      bgs2: "hsl(200 40% 30%)",
      bgs3: "hsl(200 40% 40%)",
      bgs4: "hsl(200 40% 50%)",
      fgs1: "#fff"
    },
    isActiveFgFg: true,
    isNeverFgFg: false
  },
  lightColorSchemeId: "",
  darkColorSchemeId: "",
  userThemeSetting: Theme.LIGHT,
  isSyncWithSystem: false,
  systemTheme: Theme.LIGHT,
  accessibilitySizingFactor: 1
};

describe("client/utils/theme.utils", () => {
  it("resolves saturation and lightness defaults", () => {
    const values = resolveSaturationAndLightness(appearance);
    expect(values).toEqual({ saturation: 55, lightness: 65 });
  });

  it("retrieves active color palette", () => {
    expect(retrieveCurrentColors(appearance)).toBe(appearance.colorScheme.colors);
  });

  it("generates custom color shades", () => {
    const shade = generateCustomColorShade(appearance, 180, 2);
    expect(shade).toMatch(/^hsl\(180 55% \d+% \/ 1\)$/);

    const shades = generateCustomColorShades(appearance, 120);
    expect(shades).toHaveLength(5);
    expect(shades[0]).toBeDefined();
  });

  it("produces custom color without shade variant", () => {
    expect(customColor(appearance, 90)).toMatch(/^hsl\(90 55% 65%\)$/);
  });

  it("chooses text color classes based on strength", () => {
    expect(textColorClass(appearance, ColorStrength.Normal, false)).toBe("text-fgs1");
    expect(textColorClass(appearance, ColorStrength.Subtle, true, 120)).toBe(
      "text-fgs2"
    );
  });

  it("resolves background classes for different layers", () => {
    expect(resolveBackgroundClass(appearance, 1)).toEqual(
      expect.objectContaining({
        activeBackgroundColor: "bg-bgs3",
        backgroundColor: "bg-bgs2"
      })
    );
  });

  it("determines foreground emphasis requirement", () => {
    expect(resolveIfActiveFgFg(-1, appearance)).toBe(true);
    expect(resolveIfActiveFgFg(200, { ...appearance, colorScheme: { ...appearance.colorScheme, isDark: true } })).toBe(true);
  });

  it("computes heatmap color range", () => {
    const colors = heatMapColorRange(appearance, "bgs2", 3);
    expect(colors).toHaveLength(4);
    expect(colors[0]).toMatch(/^hsl\(/);
  });
});
