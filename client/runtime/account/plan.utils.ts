import { PlanStatus, PlanType, BillingCycle, type IUserPlan } from "@nucleum/schema/account/subscription";

/** Evaluates existing subscription eligibility rules without UI dependencies. */
export function determineIfPlanIsActive(plan: IUserPlan) {
  if (plan.plan === PlanType.TRIAL && plan.trialPlan?.expiry) {
    const isExpired =
      new Date(plan.trialPlan.expiry).getTime() < new Date().getTime();
    return !isExpired;
  } else if (
    (plan.plan === PlanType.CLOUD_SYNC || plan.plan === PlanType.NUCLEUS) &&
    plan.billingErrors
  ) {
    return false;
  } else if (plan.status === PlanStatus.REFUNDED) {
    return false;
  }
  return true;
}

/** Evaluates existing subscription eligibility rules without UI dependencies. */
export function determineIfActiveSubscriber(plan: IUserPlan) {
  const isActive = determineIfPlanIsActive(plan);
  if (!isActive) return false;
  if (plan.plan === PlanType.CLOUD_SYNC || plan.plan === PlanType.NUCLEUS) {
    return true;
  }
  return false;
}

/** Evaluates existing subscription eligibility rules without UI dependencies. */
export function determineIfSubscriptionExpired(plan: IUserPlan) {
  if (plan.cycle === BillingCycle.LIFETIME)
    return {
      isExpired: false
    };
  if (plan.plan === PlanType.CLOUD_SYNC || plan.plan === PlanType.NUCLEUS) {
    const buffer = plan.status === PlanStatus.CANCELLED ? 2 : 7;
    const purchaseDate =
      typeof plan.paymentDate === "string"
        ? new Date(plan.paymentDate)
        : plan.paymentDate;
    const renewalDate = plan.renewalDate
      ? new Date(plan.renewalDate)
      : new Date(
          (purchaseDate?.getTime() ?? 0) +
            (plan.cycle === BillingCycle.MONTHLY
              ? 31 * 24 * 60 * 60 * 1000
              : 365 * 24 * 60 * 60 * 1000)
        );
    const isExpired =
      renewalDate.getTime() + 24 * 60 * 60 * 1000 < new Date().getTime();
    const isWithinBuffer =
      renewalDate.getTime() + buffer * 24 * 60 * 60 * 1000 >
      new Date().getTime();
    return {
      isExpired,
      isWithinBuffer
    };
  }
  return {
    isExpired: false
  };
}
