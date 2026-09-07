import { isExtensionEnvironment } from "@21n/utils/browser.utils";
import { bundleNumber } from "@21n/icons-v2/icons-list";
import { iconMappings, type IconSet } from "@21n/icons-v2/icons.map";
//TODO - temp for landing
import { assetPath } from "@nucleum/static";

export const spriteVersion = bundleNumber;
export const extensionSprites = new Map<string, string>();

export function getIconFromMapping(
  genericName: string,
  iconSet: IconSet
): string | null {
  const mapping = iconMappings[genericName];
  if (!mapping) return null;

  return mapping[iconSet] || mapping.phosphor;
}

export function resolveGenericIcon(genericName: string): string {
  let iconSet: IconSet = "phosphor";

  const resolvedIcon = getIconFromMapping(genericName, iconSet);
  if (resolvedIcon) {
    if (resolvedIcon.includes(":")) return resolvedIcon;
    if (iconSet === "phosphor") {
      return `ph:${resolvedIcon}-light`;
    }
    if (iconSet === "lucide") {
      return `lucide:${resolvedIcon}`;
    }
    if (iconSet === "solar") {
      return `solar:${resolvedIcon}-line-duotone`;
    }
  }
  return genericName;
}

export function cleanExtensionSprites() {
  extensionSprites.forEach((url: any) => URL.revokeObjectURL(url));
}

export function resolveSpriteSheetPath(sheet: string) {
  if (isExtensionEnvironment()) {
    return `assets/icons/${sheet}.svg`;
  }
  return assetPath(`icons/${sheet}-v${spriteVersion}.svg`);
}

// function assetPath(arg0: string) {
//   return arg0;
// }
