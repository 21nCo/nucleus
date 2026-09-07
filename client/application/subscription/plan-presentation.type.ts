import type { PlanType, BillingCycle } from "@nucleum/schema/account/subscription";

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
