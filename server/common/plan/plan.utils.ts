import { BillingCycle } from "@21n/shared-types/subscription.type";
import { PlanType } from "@21n/shared-types/subscription.type";
import { PaymentProvider } from "$lib/shared/types/plan.type";
import { paymentProductsList } from "./paymentProducts";

export function resolvePlanQuery(userId: string) {
  return `select id, context, userPlan.* as userPlan from user:${userId};`;
}

export function resolveDodoProductId({
  plan,
  cycle,
  discount,
  product,
  isTest
}: {
  plan: string;
  cycle: string;
  discount: number;
  product: string;
  isTest: boolean;
}) {
  const record = paymentProductsList.find(
    (r) =>
      r.plan === plan &&
      r.cycle === cycle &&
      (!r.discount || r.discount === discount) &&
      (!r.product || r.product === product)
  );
  if (isTest) return record?.dodoTestProductId;
  return record?.dodoProductId;
}

export function resolvePromotePlanQuery(params?: {
  id: string;
  cycle: BillingCycle;
  plan: PlanType;
  transactionId: string;
  paymentDate: string;
  provider?: PaymentProvider;
  isAutoRenew?: boolean;
  renewalDate?: string;
}) {
  const query = `
        UPDATE ${params.id} MERGE {
            cycle: "${params.cycle}",
            plan: "${params.plan}",
            transactionId: ${params.transactionId},
            paymentDate: "${params.paymentDate}",
            renewalDate: ${
              params.renewalDate ? `"${params.renewalDate}"` : `NONE`
            },
            provider: ${params.provider ? `"${params.provider}"` : `NONE`},
            status: "active",
            isAutoRenew: ${params.isAutoRenew ?? false}
        }
    `;
  return query;
}

export interface DodoPaymentResponse {
  status?: string;
  [key: string]: any;
}

export interface AppleVerificationResponse {
  status:
    | "active"
    | "expired"
    | "grace_period"
    | "billing_retry"
    | "revoked"
    | "refunded";
  originalTransactionId?: string;
  expiresDate?: string;
  environment: "Production" | "Sandbox";
  lastTransactionId?: string;
}

//pending, active, on_hold, paused, cancelled, failed, expired
export function resolveTransactionStatusFromDodo(
  isSubscription: boolean,
  paymentStatus: DodoPaymentResponse
): "completed" | "failed" | "pending" {
  if (!paymentStatus?.status) {
    return "pending";
  }

  if (isSubscription && paymentStatus.status === "active") {
    return "completed";
  }
  if (!isSubscription && paymentStatus.status === "succeeded") {
    return "completed";
  }
  if (paymentStatus.status === "failed") {
    return "failed";
  }
  return "pending";
}

export function resolveTransactionStatusFromApple(
  verificationResponse: AppleVerificationResponse
): "completed" | "failed" | "pending" {
  switch (verificationResponse.status) {
    case "active":
      return "completed";
    case "grace_period":
    case "billing_retry":
      // Still considered active but requires attention
      return "completed";
    case "expired":
    case "revoked":
    case "refunded":
      return "failed";
    default:
      return "pending";
  }
}
