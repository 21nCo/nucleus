import type { IconVariant } from "@21n/elements/icon.type";

export type DynamicIconProp = {
  name: string;
  variant?: IconVariant;
  color?: string;
  active?: boolean;
  activeColor?: string;
  class?: string;
  customPath?: string;
};
