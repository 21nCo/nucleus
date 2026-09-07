import type { PaymentProvider } from "@21n/shared-types/plan.type";
import type {
  BillingCycle,
  PlanType
} from "@21n/shared-types/subscription.type";

export type UserAccount = {
  dataMode: UserDataMode;
  userId?: string;
  token?: string;
  userInfo?: UserInformation;
  plan?: IUserPlan;
  sessionType: UserSessionType;
};

/**
 * @deprecated - use IUserProfileInfo instead from shared.types
 */
export type UserInformation = {
  id: string;
  email: string;
  nickName: string;
  phone?: string;
  joinDate: Date;
  lastLogin: Date;
  profilePictureUrl?: string;
  emailParts?: EmailParts;
  licenseType?: LicenseType;
  isBootstrapped?: boolean;
  region?: string;
};

export type EmailParts = {
  characterCount: number;
  emailDomain: string;
  firstFew: string;
  lastFew?: string;
};

export enum LicenseType {
  EA_LIFETIME = "EA_LIFETIME",
  EA_EXTENDED = "EA_EXTENDED",
  LIFETIME = "LIFETIME",
  YEARLY = "YEARLY",
  MONTHLY = "MONTHLY",
  FREE = "FREE"
}

export enum UserDataMode {
  NONE = "NONE",
  LOCAL = "LOCAL",
  CLOUD = "CLOUD"
}

export enum UserSessionType {
  UNDETERMINED = "UNDETERMINED",
  NEW = "NEW",
  RETURNING = "RETURNING"
}

export enum PlanStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}

export interface IUserPlan {
  plan: PlanType;
  cycle?: BillingCycle;
  /**
   * @deprecated
   */
  billingCycle?: BillingCycle;
  trialPlan?: ITrialPlan;
  discount?: any;
  billingErrors?: any;
  status?: PlanStatus;
  isCancelled?: boolean;
  paymentDate?: Date;
  renewalDate?: Date;
  provider?: PaymentProvider;
  isAutoRenew?: boolean;
}

export interface ITrialPlan {
  plan: TrialPlanType;
  expiry: Date;
}

export enum TrialPlanType {
  ONE_YEAR = "1year",
  FOUR_MONTHS = "4mo",
  ONE_MONTH = "1mo",
  TWO_WEEKS = "2w"
}
