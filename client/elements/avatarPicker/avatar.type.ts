import type { IRecordId } from "@nucleum/schema/legacy/data.type";

export type CustomUploadedAvatar = {
  name: string;
  frequency: number;
  type: AvatarType.CUSTOM_UPLOAD;
  file: IRecordId;
};

export type EmojiAvatar = {
  type: AvatarType.EMOJI;
  skinIndex?: number;
};

export type IconAvatar = {
  type: AvatarType.ICON;
  isFilled: boolean;
  color?: string;
};

export type AvatarWithCode<T = EmojiAvatar | IconAvatar> = {
  name?: string;
  frequency?: number;
  code: string;
} & T;

export type IAvatar<T = EmojiAvatar | IconAvatar> =
  | AvatarWithCode<T>
  | CustomUploadedAvatar;

export enum AvatarType {
  EMOJI = "EMOJI",
  ICON = "ICON",
  CUSTOM_UPLOAD = "CUSTOM_UPLOAD"
}

export enum AvatarPickerContext {
  DEFAULT = "DEFAULT",
  RATING_AVATAR = "RATING_AVATAR",
  CALLOUT_AVATAR = "CALLOUT_AVATAR"
}
