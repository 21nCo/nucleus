import type { ISelectItem } from "@21n/elements/select/select.type";

export type IContextMenu = IContextMenuGroup[];

export type IContextMenuGroup = {
  group: string;
  items: IContextMenuItem[];
  isToggleGroup?: boolean;
};

export type IContextMenuItem = ISelectItem & {
  callback?: (props?: any) => Promise<void>;
  action?: string;
  type?: ContextMenuType;
  initialValue?: boolean;
  secondStepComponent?: {
    component: any;
    props?: any;
  };
};

export enum ContextMenuType {
  DEFAULT,
  SWITCH
}
