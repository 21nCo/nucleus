import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";

export type ISelectItem = {
  value: ISelectValue;
  label?: string;
  icon?: string | IAvatar;
  activeIcon?: string | IAvatar;
  activeLabel?: string;
  isDisabled?: boolean;
  badge?: string | number;
  tooltip?: string;
};

export enum OptionSelectorStyle {
  TRAIN,
  OUTLINE,
  CHECK_CIRCLE,
  ICON
}

export type ISelectValue = string | number | boolean;

export type IResourceSwitchItem = ISelectItem & {
  isHidePinAction?: boolean;
  isPinned?: boolean;
};
