import { Agent } from "../../account/account.type";
import {
  BillingCycle,
  PlanType
} from "@nucleum/schema/account/subscription";
import { ValidationError } from "../../errors";
import { performQueryOnMasterDb } from "$lib/server/surrealHelpers";
import {
  resolvePlanQuery,
  resolveTransactionStatusFromDodo
} from "../plan.utils";
import {
  cancelSubscription,
  refundPayment,
  refundPaymentForSubscription,
  verifyPayment
} from "../dodoPaymentProvider";
import { PaymentProvider } from "@nucleum/schema/account/payment-provider";
import {
  AppleVerificationResponse,
  getLatestSubscriptionPayment,
  verifyAppleSubscription
} from "../applePaymentProvider";

interface ModifyRequest {
  type: "cancel" | "switch" | "sync";
  plan?: PlanType;
  cycle?: BillingCycle;
  billing?: any;
  embedTransaction?: any;
}
const isPartialRefundAvailable =
  process.env.PARTIAL_REFUND_AVAILABLE === "true";

export function modify(body: ModifyRequest, agent: Agent) {
  if (body.type === "cancel") {
    return cancel(agent);
  } else if (body.type === "switch") {
    return switchPlan(body, agent);
  } else if (body.type === "sync") {
    return sync(body, agent);
  }
}

async function cancel(agent: Agent) {
  const user = await retrieveUserPlan(agent.id);
  if (!user?.userPlan?.transactionId) {
    throw new ValidationError("No active subscription found");
  }

  const transaction = await retrieveTransaction(user.userPlan.transactionId);
  if (!transaction) {
    throw new ValidationError("Transaction not found");
  }

  if (transaction.dodoPayment?.subscription_id) {
    const subscriptionData = await cancelSubscription(
      transaction.dodoPayment.subscription_id
    );
    // console.log({ subscriptionData, transaction });
    await updateSubscriptionStatus(transaction.id, subscriptionData);
  }
  if (
    user.userPlan.status === "refunded" ||
    user.userPlan.status === "cancelled"
  ) {
    console.log("Subscription already cancelled");
    return {
      status: "success",
      message: "Subscription cancelled successfully"
    };
  }
  let newStatus = "cancelled";
  if (
    transaction.cycle === BillingCycle.YEARLY ||
    transaction.cycle === BillingCycle.LIFETIME
  ) {
    const paymentDate = new Date(transaction.createdAt);
    const now = new Date();
    const totalDays = transaction.cycle === BillingCycle.YEARLY ? 365 : 36500;
    const daysUsed = Math.floor(
      (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log({ daysUsed, totalDays });
    if (daysUsed > 30 && isPartialRefundAvailable) {
      const remainingDays = Math.max(0, totalDays - daysUsed);
      const refundAmount = Math.floor(
        (remainingDays / totalDays) * transaction.amount
      );

      if (refundAmount > 0 && transaction.dodoPayment?.payment_id) {
        const data = await refundPayment(
          transaction.dodoPayment.payment_id,
          refundAmount
        );
        await updateRefundStatus(transaction.id, data);
        newStatus = "refunded";
      }
    } else if (daysUsed <= 30 && transaction.dodoPayment?.payment_id) {
      const data = await refundPayment(
        transaction.dodoPayment.payment_id,
        transaction.dodoPayment.total_amount
      );
      await updateRefundStatus(transaction.id, data);
      newStatus = "refunded";
    } else if (daysUsed <= 30 && transaction.dodoPayment?.subscription_id) {
      const data = await refundPaymentForSubscription(
        transaction.dodoPayment.subscription_id,
        transaction.dodoPayment.recurring_pre_tax_amount
      );
      if (data) {
        await updateRefundStatus(transaction.id, data);
        newStatus = "refunded";
      }
    }
  }

  const updatePlanQuery = `
    UPDATE ${user.userPlan.id} MERGE {
      status: "${newStatus}",
      cancelledAt: time::now()
    }
  `;
  await performQueryOnMasterDb(updatePlanQuery);

  return { status: "success", message: "Subscription cancelled successfully" };
}

async function retrieveUserPlan(id: string) {
  const userDataResult = await performQueryOnMasterDb(resolvePlanQuery(id));
  if (!userDataResult || !userDataResult[0])
    throw new ValidationError("User not found");
  const user = userDataResult[0].result?.[0];
  return user;
}

async function retrieveTransaction(id: string) {
  const query = `SELECT * FROM ${id}`;
  const transactionResult = await performQueryOnMasterDb(query);
  if (!transactionResult || !transactionResult[0]?.result?.[0]) {
    return null;
  }
  return transactionResult[0].result[0];
}

async function updateRefundStatus(transactionId: string, refundData?: any) {
  const updateTransactionQuery = `
    UPDATE ${transactionId} MERGE {
      status: "refunded",
      refundedAt: time::now(),
      refundData: ${JSON.stringify(refundData)}
    }
  `;
  await performQueryOnMasterDb(updateTransactionQuery);
}

async function updateSubscriptionStatus(
  transactionId: string,
  subscriptionUpdateData?: any
) {
  const updateTransactionQuery = `
      UPDATE ${transactionId} MERGE {
        subScriptionStatus: "cancelled",
        subscriptionUpdateData: ${JSON.stringify(subscriptionUpdateData)}
      }
    `;
  await performQueryOnMasterDb(updateTransactionQuery);
}

function switchPlan(body: ModifyRequest, agent: Agent) {}

/**
 * Syncs status of the subscription with the latest status from the payment provider
 * @param agent
 */
async function sync(body: ModifyRequest, agent: Agent) {
  const user = await retrieveUserPlan(agent.id);
  if (!user?.userPlan?.transactionId) {
    throw new ValidationError("No active subscription found");
  }

  const transaction = await retrieveTransaction(user.userPlan.transactionId);
  if (!transaction) {
    throw new ValidationError("Transaction not found");
  }

  if (!transaction.provider || transaction.provider === PaymentProvider.SELF) {
    if (!transaction.dodoPayment?.subscription_id) return;
    const verificationResponse = await verifyPayment(
      transaction.dodoPayment?.subscription_id,
      true
    );
    if (!verificationResponse) {
      throw new ValidationError("Subscription verification failed");
    }
    const renewalDate =
      "next_billing_date" in verificationResponse
        ? verificationResponse.next_billing_date
        : undefined;
    const updateQuery = `
      UPDATE ${transaction.id} MERGE {
        status: "${verificationResponse.status}",
        renewalDate: "${renewalDate}"
      }
    `;
    await performQueryOnMasterDb(updateQuery);
    const userPlan = await retrieveUserPlan(agent.id);
    return userPlan;
  } else if (transaction.provider === PaymentProvider.APPLE) {
    let verificationResponse: AppleVerificationResponse | null = null;
    console.log({
      at: "sync - verifying apple subscription",
      transactionId: transaction.applePayment?.originalTransactionId
    });
    if (transaction.applePayment?.originalTransactionId) {
      verificationResponse = await verifyAppleSubscription(
        transaction.applePayment.originalTransactionId
      );
    }

    if (!verificationResponse) {
      console.log("Subscription verification failed. Trying fallback methods");
      //TODO - fallback with history API and embedTransaction from body
      if (transaction.applePayment?.originalTransactionId) {
        const latestTransaction = await getLatestSubscriptionPayment(
          transaction.applePayment.originalTransactionId
        );
        if (latestTransaction) {
          verificationResponse = {
            ...latestTransaction,
            status: "active"
          };
        }
      } else if (
        body.embedTransaction &&
        Array.isArray(body.embedTransaction) &&
        body.embedTransaction?.[0]?.transactionId
      ) {
        verificationResponse = await verifyAppleSubscription(
          body.embedTransaction?.[0]?.transactionId
        );
      }
      if (!verificationResponse) {
        throw new ValidationError("Subscription verification failed");
      }
    }
    const transactionUpdateQuery = `
      UPDATE ${transaction.id} MERGE {
        lastVerified: time::now(),
        subscriptionUpdateData: ${JSON.stringify(verificationResponse)}
      }
    `;
    await performQueryOnMasterDb(transactionUpdateQuery);
    const isAutoRenew =
      verificationResponse.renewalData?.autoRenewStatus === 1 ? true : false;
    const latestPurchaseDate = new Date(
      verificationResponse.purchaseDate
    ).toISOString();
    const updateQuery = `
        UPDATE ${user.userPlan.id} MERGE {
          paymentDate: "${latestPurchaseDate}",
          renewalDate: "${verificationResponse.renewalDate}",
          status: "${verificationResponse.status}",
          isAutoRenew: ${isAutoRenew}
        }`;
    await performQueryOnMasterDb(updateQuery);
    const userPlan = await retrieveUserPlan(agent.id);
    return userPlan;
  }
}
