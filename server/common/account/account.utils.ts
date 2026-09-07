import { IUserProfileInfo } from "@nucleum/schema/account/profile.type";

export function frameNonSensitiveUserInfo(userInfo: IUserProfileInfo) {
  const {
    id,
    emailParts,
    nickName,
    profilePictureUrl,
    joinDate,
    region,
    isBootstrapped
  } = userInfo;
  return {
    id,
    emailParts,
    nickName,
    profilePictureUrl,
    joinDate,
    region,
    isBootstrapped
  };
}

export function getEmailParts(email: string) {
  const emailParts = email.split("@");
  const emailName = emailParts[0];
  const characterCount = emailName.length;
  let snapLength = 3;
  if (characterCount <= snapLength * 2) snapLength = 2;
  if (characterCount <= snapLength * 2) snapLength = 1;
  const firstFew = emailName.substring(0, snapLength);
  const lastFew = emailName.substring(emailName.length - snapLength);
  const emailDomain = emailParts[1];
  return {
    characterCount,
    firstFew,
    lastFew,
    emailDomain
  };
}
