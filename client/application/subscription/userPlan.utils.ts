import { determineIfPlanIsActive } from "@nucleum/client/runtime/account/plan.utils";
import { LicenseType } from "@nucleum/client/runtime/account/account.type";
import { PlanStatus, type IUserPlan } from "@nucleum/schema/account/subscription";
import { parseAndFormatDate } from "@21n/utils/time.utils";
import { enumToString } from "@21n/shared-utils/text.utils";
import { BillingCycle, PlanType } from "@nucleum/schema/account/subscription";
import { type IPlan } from "@nucleum/application/subscription/plan-presentation.type";

const plans = import.meta?.env?.VITE_PLANS;
let rates: number[] = [7, 60, 200, 15, 144, 450];
if (plans) {
  rates = plans.split(",").map((rate: string) => parseInt(rate));
}

export const SUBSCRIPTION_PLANS: IPlan[] = [
  {
    name: "sync",
    type: PlanType.CLOUD_SYNC,
    description: "Real-time sync across all devices",
    price: {
      [BillingCycle.MONTHLY]: rates[0],
      [BillingCycle.YEARLY]: rates[1],
      [BillingCycle.LIFETIME]: rates[2]
    },
    features: [
      {
        icon: "check-circle",
        label: "All core features"
      },
      {
        icon: "arrows-left-right",
        label: "Sync across all devices"
      },
      {
        icon: "file",
        label: "Unlimited storage for small files (< 25 MB)"
      },
      // {
      //   icon: "ph:lock-light",
      //   label: "End-to-end encryption"
      // },
      {
        icon: "database",
        label: "20 GB of included large file storage"
      },
      {
        icon: "at",
        label: "Email and community support"
      }
    ]
  },
  {
    name: "Nucleum",
    type: PlanType.NUCLEUS,
    description: "Everything productivity, single plan",
    price: {
      [BillingCycle.MONTHLY]: rates[3],
      [BillingCycle.YEARLY]: rates[4],
      [BillingCycle.LIFETIME]: rates[5]
    },
    features: [
      {
        icon: "check-circle",
        label: "Everything in Sync plan"
      },
      {
        icon: "database",
        label: "100 GB of included large file storage"
      },
      {
        icon: "sparkle",
        label: "Access to [Nucleum](https://nucleus.to) (Web app)"
      },
      // {
      //   icon: "ph:brain-light",
      //   label: "Access to MCP server *(coming soon)*"
      // },
      {
        icon: "clock",
        label: "Early access to new products, features"
      },
      {
        icon: "chat-three",
        label: "Priority chat support"
      },
      {
        icon: "support",
        label: "Support our [mission](https://21n.org)"
      }
    ],
    isPopular: true
  }
];

export function resolveLicenseString(userInfo: any) {
  if (userInfo?.licenseType) {
    switch (userInfo?.licenseType) {
      case LicenseType.EA_LIFETIME:
        return "Early Adopter - lifetime license";
      case LicenseType.EA_EXTENDED:
        return "Early Adopter - 2 years extended trial";
      case LicenseType.FREE:
        return "Free plan";
    }
  } else if (userInfo?.joinDate) {
    const joinDate = new Date(userInfo?.joinDate);
    const joinDateIsBeforeJan012024 = joinDate < new Date(2024, 1, 1);
    const joinDateIsBeforeNov132024 = joinDate < new Date(2024, 10, 13);
    const joinDateIsBeforeNov182024 = joinDate < new Date(2024, 10, 18);
    const joinDateIsBeforeDec012024 = joinDate < new Date(2024, 11, 1);
    if (joinDateIsBeforeJan012024) {
      return "Early Adopter - lifetime license";
    } else if (joinDateIsBeforeNov132024) {
      return "1 year free cloud sync 🎉 (First 500 early adopters)";
    } else if (joinDateIsBeforeNov182024) {
      return "4 mo free cloud sync 🎉 (First 1000 early adopters)";
    } else if (joinDateIsBeforeDec012024) {
      return "2 mo free cloud sync 🎉 (First 5000 users)";
    } else {
      return "Early Adopter - limited free cloud sync trial";
    }
  }
}

export function resolvePlanLabel(plan: IUserPlan | undefined) {
  if (!plan || !plan.plan) return "Unknown plan";
  if (plan.plan === PlanType.TRIAL) {
    const isActive = determineIfPlanIsActive(plan);
    if (!isActive) {
      return `Free trial expired - Please upgrade`;
    } else if (plan.trialPlan?.expiry) {
      return `Sync free trial (Expires ${parseAndFormatDate(
        new Date(plan.trialPlan?.expiry)
      )})`;
    } else {
      return `Sync free trial`;
    }
  } else if (
    plan.plan === PlanType.NUCLEUS ||
    plan.plan === PlanType.CLOUD_SYNC
  ) {
    if (
      plan.status === PlanStatus.REFUNDED ||
      plan.status === PlanStatus.CANCELLED
    ) {
      return `Plan cancelled`;
    } else if (plan.billingErrors) {
      return `Billing issue`;
    } else {
      return `${enumToString(plan.plan)} - ${plan.cycle} plan`;
    }
  } else {
    return `Unknown plan`;
  }
}

export function resolveDiscountLabel(plan: IUserPlan) {
  if (!plan?.discount) return null;
  if (plan.discount.first) {
    const discount = plan.discount.first;
    if (discount === 50) {
      return "As a early adopter, you get 50% off for annual/lifetime plans on your first purchase";
    } else if (discount === 35) {
      return "As a early member, you get 35% off for annual/lifetime plans on your first purchase";
    } else {
      return `You are eligible for a ${discount}% discount on your first purchase`;
    }
  }
  return null;
}

export function resolveNextRenewalDate(plan: IUserPlan) {
  if (
    !plan?.paymentDate ||
    plan.plan === PlanType.TRIAL ||
    plan.cycle === BillingCycle.LIFETIME
  )
    return null;
  const paymentDate = new Date(plan.paymentDate);
  let multiplier = 1;
  if (plan.cycle === BillingCycle.MONTHLY) {
    multiplier = 30;
  } else if (plan.cycle === BillingCycle.YEARLY) {
    multiplier = 365;
  }
  const nextRenewal = new Date(
    paymentDate.getTime() + 24 * 60 * 60 * 1000 * multiplier
  );
  return nextRenewal;
}

export function resolveTrialDaysLeft(plan: IUserPlan) {
  if (plan.plan !== PlanType.TRIAL) return null;
  const trialPlan = plan.trialPlan;
  if (!trialPlan) return null;
  const expiry = new Date(trialPlan.expiry);
  const daysLeft = Math.ceil(
    (expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysLeft;
}
