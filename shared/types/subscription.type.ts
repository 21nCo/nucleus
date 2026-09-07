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

export interface IPlan {
  name: string;
  type: PlanType;
  description: string;
  price: Record<BillingCycle, number>;
  features: {
    icon: string;
    label: string;
  }[];
  isPopular?: boolean;
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
