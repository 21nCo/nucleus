import { Agent } from "../../account/account.type";
import {
  ValidationError,
  NotFoundError,
  InternalServerError
} from "../../errors";
import { performQueryOnMasterDb } from "$lib/server/surrealHelpers";
import { verifyPayment } from "../dodoPaymentProvider";
import {
  verifyAppleNonConsumablePurchase,
  verifyAppleSubscription
} from "../applePaymentProvider";
import {
  BillingCycle,
  PlanType
} from "@21n/shared-types/subscription.type";
import {
  resolvePlanQuery,
  resolvePromotePlanQuery,
  resolveTransactionStatusFromDodo,
  resolveTransactionStatusFromApple
} from "../plan.utils";
import { PaymentProvider } from "$lib/shared/types/plan.type";

interface VerifyRequest {
  nonce: string;
  embedTransaction?: any;
  isReconciliation?: boolean;
}

export async function verify(body: VerifyRequest, agent: Agent) {
  if (!body.nonce) {
    throw new ValidationError("Nonce is required", "nonce");
  }

  const user = await retrieveUserPlan(agent.id);
  const transaction = await retrieveTransaction(body.nonce);
  if (transaction.status === "completed" && !body.isReconciliation) {
    return user;
  }

  let result = null;
  if (transaction.provider) {
    switch (transaction.provider) {
      case PaymentProvider.APPLE:
        result = await handleAppleStoreVerification({
          transaction,
          body,
          user
        });
        break;
      case PaymentProvider.GOOGLE:
        result = await handleGoogleStoreVerification({ transaction, user });
        break;
      case PaymentProvider.MICROSOFT:
        result = await handleMicrosoftStoreVerification({ transaction, user });
        break;
      case PaymentProvider.SELF:
        result = await handleDodoPaymentVerification(transaction, user);
        break;
      default:
        throw new InternalServerError("Invalid provider");
    }
  } else {
    result = await handleDodoPaymentVerification(transaction, user);
  }
  return result;
}

async function handleDodoPaymentVerification(transaction: any, user: any) {
  if (
    !transaction.dodoPayment ||
    (!transaction.dodoPayment.payment_id &&
      !transaction.dodoPayment.subscription_id)
  ) {
    throw new InternalServerError(
      "Invalid transaction: missing payment information"
    );
  }
  const isSubscription = !!transaction.dodoPayment.subscription_id;
  const paymentStatus = await verifyPayment(
    transaction.dodoPayment.subscription_id ??
      transaction.dodoPayment.payment_id,
    isSubscription
  );

  if (!paymentStatus) {
    throw new InternalServerError("Failed to verify payment status");
  }

  const newStatus = resolveTransactionStatusFromDodo(
    isSubscription,
    paymentStatus
  );
  const updateQuery = `
    UPDATE ${transaction.id} MERGE {
      status: "${newStatus}",
      lastVerified: time::now(),
      paymentStatus: ${JSON.stringify(paymentStatus)}
    }
  `;

  const updateResult = await performQueryOnMasterDb(updateQuery);

  if (!updateResult || !updateResult[0]?.result?.[0]) {
    throw new InternalServerError("Failed to update transaction status");
  }

  const updatedTransaction = updateResult[0].result[0];
  const renewalDate =
    "next_billing_date" in paymentStatus
      ? paymentStatus.next_billing_date
      : undefined;

  if (newStatus === "completed") {
    const userPlanUpdateResult = await promoteUserPlan({
      id: user.userPlan.id,
      cycle: updatedTransaction.cycle,
      plan: updatedTransaction.plan,
      transactionId: updatedTransaction.id,
      paymentDate: updatedTransaction.createdAt,
      isAutoRenew: isSubscription,
      renewalDate,
      provider: PaymentProvider.SELF
    });
    if (!userPlanUpdateResult || !userPlanUpdateResult[0]?.result?.[0]) {
      throw new InternalServerError("Failed to update user plan");
    }
    const updatedUserPlan = userPlanUpdateResult[0].result[0];
    return updatedUserPlan;
  }
  console.log({ newStatus });
  return {
    status: newStatus
  };
}

async function handleAppleStoreVerification(params: {
  transaction: any;
  body: any;
  user: any;
}) {
  const { transaction, body, user } = params;
  const transactionId = Array.isArray(body.embedTransaction)
    ? body.embedTransaction[0]?.transactionId
    : typeof body.embedTransaction === "string"
      ? body.embedTransaction
      : null;
  if (!transactionId) {
    throw new InternalServerError(
      "Invalid Apple transaction: missing transaction information"
    );
  }
  console.log({ transactionId });
  let verificationResponse = null;
  if (transaction?.cycle === BillingCycle.LIFETIME) {
    verificationResponse =
      await verifyAppleNonConsumablePurchase(transactionId);
  } else {
    verificationResponse = await verifyAppleSubscription(transactionId);
  }
  // console.log({ verificationResponse });
  if (!verificationResponse) {
    throw new InternalServerError("Failed to verify Apple subscription status");
  }

  // Map Apple's status to our system status using the utility function
  const newStatus = resolveTransactionStatusFromApple(verificationResponse);

  // Update transaction status
  const updateQuery = `
    UPDATE ${transaction.id} MERGE {
      status: "${newStatus}",
      lastVerified: time::now(),
      applePayment: {
        transactionId: "${transactionId}",
        originalTransactionId: "${
          verificationResponse.originalTransactionId || ""
        }",
        lastTransactionId: "${verificationResponse.lastTransactionId || ""}",
        expiresDate: "${verificationResponse.expiresDate || ""}",
        purchaseDate: "${verificationResponse.purchaseDate || ""}",
        environment: "${verificationResponse.environment}",
        status: "${verificationResponse.status}",
        transactionData: ${JSON.stringify(
          verificationResponse.transactionData
        )},
        renewalData: ${JSON.stringify(verificationResponse.renewalData)}
      }
    }
  `;

  const updateResult = await performQueryOnMasterDb(updateQuery);

  if (!updateResult || !updateResult[0]?.result?.[0]) {
    throw new InternalServerError("Failed to update Apple transaction status");
  }

  const updatedTransaction = updateResult[0].result[0];

  if (newStatus === "completed") {
    const userPlanUpdateResult = await promoteUserPlan({
      id: user.userPlan.id,
      cycle: updatedTransaction.cycle,
      plan: updatedTransaction.plan,
      transactionId: updatedTransaction.id,
      paymentDate: updatedTransaction.createdAt,
      renewalDate: verificationResponse.renewalDate,
      provider: PaymentProvider.APPLE,
      isAutoRenew: true
    });

    if (!userPlanUpdateResult || !userPlanUpdateResult[0]?.result?.[0]) {
      throw new InternalServerError(
        "Failed to update user plan after Apple verification"
      );
    }

    const updatedUserPlan = userPlanUpdateResult[0].result[0];
    return updatedUserPlan;
  }

  console.log({ newStatus });
  return {
    status: newStatus
  };
}

async function handleGoogleStoreVerification(params: {
  transaction: any;
  user: any;
}) {
  const { transaction, user } = params;
  console.log({ transaction });
  // Implementation would follow similar pattern to Apple verification
  throw new InternalServerError(
    "Google Store verification not implemented yet"
  );
}

async function handleMicrosoftStoreVerification(params: {
  transaction: any;
  user: any;
}) {
  const { transaction, user } = params;
  console.log({ transaction });
  // Implementation would follow similar pattern to Apple verification
  throw new InternalServerError(
    "Microsoft Store verification not implemented yet"
  );
}

export async function webhook(body: any) {
  console.log({ body });
}

async function retrieveTransaction(nonce: string) {
  const query = `SELECT * FROM transaction WHERE nonce = "${nonce}"`;
  const transactionResult = await performQueryOnMasterDb(query);
  if (!transactionResult || !transactionResult[0]?.result?.[0]) {
    throw new NotFoundError("Transaction not found");
  }
  return transactionResult[0].result[0];
}

async function promoteUserPlan(params?: {
  id: string;
  cycle: BillingCycle;
  plan: PlanType;
  transactionId: string;
  paymentDate: string;
  provider?: PaymentProvider;
  isAutoRenew?: boolean;
  renewalDate?: string;
}) {
  const query = resolvePromotePlanQuery(params);
  const updateResult = await performQueryOnMasterDb(query);
  return updateResult;
}

async function retrieveUserPlan(id: string) {
  const userDataResult = await performQueryOnMasterDb(resolvePlanQuery(id));
  if (!userDataResult || !userDataResult[0])
    throw new ValidationError("User not found");
  const user = userDataResult[0].result?.[0];
  return user;
}
