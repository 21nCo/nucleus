import type { DropdownGroup } from "@21n/types/dropdownItem.type";

export type IPropertyTypeSelectorGroup = DropdownGroup & {
  mode: PropertyTypeMode;
  isDisabled?: boolean;
  badge?: string;
};

export enum PropertyTypeMode {
  MANUAL = "manual",
  AUTO = "auto"
}

export enum PropertyTypeGroup {
  DEFAULT = "default",
  TEXT = "text",
  SELECT = "select",
  WIZARD = "wizard",
  SYSTEM = "system",
  RULE_BASED = "rule-based",
  /**
   * @deprecated - use SYSTEM group instead
   */
  DETECTION = "detection",
  /**
   * @deprecated - in favor of links, synced collections
   */
  INTEGRATION = "integration"
}
