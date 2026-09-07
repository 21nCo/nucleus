export enum BillingCycle {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  LIFETIME = "lifetime"
}

export enum PlanType {
  TRIAL = "trial",
  CLOUD_SYNC = "sync",
  NUCLEUS = "nucleus"
}

/**
 * @deprecated - use IUserPlan instead
 */
export interface ICurrentPlan {
  type: PlanType;
  billingCycle: BillingCycle;
}

export interface IBillingAddress {
  name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
}

import type { PaymentProvider } from "@nucleum/schema/account/payment-provider";

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
