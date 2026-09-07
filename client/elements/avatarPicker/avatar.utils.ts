import { isRecordId } from "@nucleum/datafn/resource.utils";
import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";
import { isValidString } from "@21n/shared-utils/text.utils";

export function isValidAvatar(avatar: IAvatar | undefined) {
  return (
    avatar &&
    typeof avatar === "object" &&
    (("code" in avatar && isValidString(avatar.code)) ||
      ("file" in avatar && isRecordId(avatar.file)))
  );
}
