import type { ISelectItem } from "@21n/elements/select/select.type";
import type { FormLabelInfoTooltip } from "@21n/elements/text/info.type";

export type DropdownItem = ISelectItem & {
  groupId?: string;
};

export type DropdownGroup = {
  id: string;
  label: string;
  order: number;
  info?: FormLabelInfoTooltip;
};

/**
 * @deprecated - Use InputStyle instead
 */
export enum DropDownStyle {
  DEFAULT,
  OUTLINED,
  /**
   * @deprecated - Use PanelSwitcher instead
   */
  PANEL_SWITCH
}
