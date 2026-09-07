export type RenderFunction = (value: any) => any;

export type TableRowItem = {
  id: string;
  [key: string]: any;
};

export type TableColumnItem = {
  label: string;
  key: string;
  width?: string;
  icon?: string;
  render?: RenderFunction;
  action?: (...args: any[]) => any;
};

export type TableCell = TableRowItem | TableColumnItem;
