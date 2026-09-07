export type IUserProfileInfo = {
  id: string;
  emailhash: string;
  nickName: string;
  joinDate: string;
  profilePictureUrl?: string;
  emailParts?: EmailParts;
  isBootstrapped?: boolean;
  region?: string;
  isOAuth?: boolean;
  oAuthId?: string;
  phone?: string;
  pass?: string;
  passhash?: string;
  context?: any;
};

export type EmailParts = {
  characterCount: number;
  emailDomain: string;
  firstFew: string;
  lastFew?: string;
};
