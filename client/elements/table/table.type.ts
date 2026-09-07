import type { DropdownGroup, DropdownItem } from "@21n/elements/dropdown/dropdownItem.type";
import type { InputLabelInfoToolTip, InputStyle } from "@21n/elements/input/input.type";

export type TableColumn = {
  /**
   * Key using which cell value will be resolved.
   * For ActionColumm: icon to be used for the action - passed as key.
   */
  key: string;
  tooltip?: InputLabelInfoToolTip;
  disabledCriteria?: (row: any) => boolean;
} & (
  | IconActionColumn
  | DropdownActionColumn
  | TextInputColumn
  | CustomColumn
  | (BaseColumn & {
      align?: "left" | "center" | "right";
      sortable?: boolean;
      filterable?: boolean;
      formatter?: (value: any) => any;
      type?: TableCellType;
    })
);

type BaseColumn = {
  label: string;
  width?: number;
};

export type TextInputColumn = BaseColumn & {
  type: TableCellType.TEXT_INPUT;
  placeholder?: string | ((row: any) => string);
};

export type DropdownActionColumn = BaseColumn & {
  type: TableCellType.DROPDOWN;
  options: DropdownItem[];
  groups?: DropdownGroup[];
  style?: InputStyle;
};

export type CustomColumn = BaseColumn & {
  type: TableCellType.CUSTOM;
  /**
   * The component to be rendered in the cell. Uses ComponentResolver to resolve the component. List the component in actionMap to resolve it.
   */
  component: string | ConstructorOfATypedSvelteComponent;
  componentProps?: Record<string, any> | ((row: any) => Record<string, any>);
};

export type IconActionColumn = {
  type: TableCellType.ACTION;
  actionTooltip?: InputLabelInfoToolTip;
  action: (row: any) => void;
};

export enum TableCellType {
  TEXT_INPUT = "TEXT_INPUT",
  DROPDOWN = "DROPDOWN",
  CHECKBOX = "CHECKBOX",
  DATE_PICKER = "DATE_PICKER",
  TOGGLE = "TOGGLE",
  ACTION = "ACTION",
  CUSTOM = "CUSTOM"
}

export enum TableCellDefaultAction {
  REORDER = "REORDER",
  REMOVE = "REMOVE",
  SELECT_ROW = "SELECT_ROW",
  MULTI_SELECT_ROW = "MULTI_SELECT_ROW"
}
