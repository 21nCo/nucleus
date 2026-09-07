import { BillingCycle } from "@nucleum/schema/account/subscription";
import { PlanType } from "@nucleum/schema/account/subscription";
import { performQueryOnMasterDb } from "$lib/server/surrealHelpers";
import { Agent } from "../../account/account.type";
import {
  resolvePromotePlanQuery,
  resolvePlanQuery,
  resolveTransactionStatusFromDodo
} from "../plan.utils";
import { ValidationError, InternalServerError } from "../../errors";
import { verifyPayment } from "../dodoPaymentProvider";

export async function restore(body: any, agent: Agent) {
  const user = await retrieveUserPlan(agent.id);
  if (!user?.userPlan) {
    throw new ValidationError("User plan not found");
  }

  //TODO - use enum
  if (
    user.userPlan.status === "active" &&
    user.userPlan.plan !== PlanType.TRIAL
  ) {
    return user;
  }

  const transactions = await retrieveUserTransactions(agent.id);
  if (!transactions || transactions.length === 0) {
    return { status: "no_transactions" };
  }

  const validTransactions = await findValidTransaction(transactions, agent.id);
  if (!validTransactions || validTransactions.length === 0) {
    return { status: "no_valid_transaction" };
  }
  const transaction = validTransactions[0];
  const userPlanUpdateResult = await promoteUserPlan({
    id: user.userPlan.id,
    cycle: transaction.cycle,
    plan: transaction.plan,
    transactionId: transaction.id,
    paymentDate: transaction.createdAt
  });
  if (!userPlanUpdateResult || !userPlanUpdateResult[0]?.result?.[0]) {
    throw new InternalServerError("Failed to update user plan");
  }

  return {
    userPlan: userPlanUpdateResult[0].result[0],
    status:
      validTransactions.length > 1 ? "multiple_valid_transactions" : "success"
  };
}

async function retrieveUserPlan(id: string) {
  const userDataResult = await performQueryOnMasterDb(resolvePlanQuery(id));
  if (!userDataResult || !userDataResult[0]) {
    throw new ValidationError("User not found");
  }
  return userDataResult[0].result?.[0];
}

async function retrieveUserTransactions(userId: string) {
  const query = `SELECT * FROM transaction WHERE userId = user:${userId} ORDER BY createdAt DESC`;
  const transactionResult = await performQueryOnMasterDb(query);
  if (!transactionResult || !transactionResult[0]?.result) {
    return [];
  }
  return transactionResult[0].result;
}

async function findValidTransaction(transactions: any[], userId: string) {
  const transactionsWithPendingStatus = transactions.filter(
    (transaction) => transaction.status === "pending"
  );
  if (transactionsWithPendingStatus.length > 0) {
    await reconcilePayments(transactionsWithPendingStatus);
    transactions = await retrieveUserTransactions(userId);
  }

  const now = new Date();

  return transactions.filter((transaction) => {
    if (transaction.status !== "completed") {
      return false;
    }

    const paymentDate = new Date(transaction.createdAt);
    const cycleInDays =
      transaction.cycle === BillingCycle.MONTHLY
        ? 30
        : transaction.cycle === BillingCycle.YEARLY
          ? 365
          : transaction.cycle === BillingCycle.LIFETIME
            ? 36500
            : 0;

    const expiryDate = new Date(
      paymentDate.getTime() + cycleInDays * 24 * 60 * 60 * 1000
    );
    return expiryDate > now;
  });
}

async function promoteUserPlan(params?: {
  id: string;
  cycle: BillingCycle;
  plan: PlanType;
  transactionId: string;
  paymentDate: string;
}) {
  const query = resolvePromotePlanQuery(params);
  const updateResult = await performQueryOnMasterDb(query);
  return updateResult;
}

async function reconcilePayments(transactions: any[]) {
  const updatePromises = transactions.map(async (transaction) => {
    if (
      !transaction.dodoPayment ||
      (!transaction.dodoPayment.payment_id &&
        !transaction.dodoPayment.subscription_id)
    ) {
      return;
    }

    const isSubscription = !!transaction.dodoPayment.subscription_id;
    const paymentStatus = await verifyPayment(
      transaction.dodoPayment.subscription_id ??
        transaction.dodoPayment.payment_id,
      isSubscription
    );

    if (!paymentStatus) {
      console.error(
        `Failed to verify payment status for transaction ${transaction.id}`
      );
      return;
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

    await performQueryOnMasterDb(updateQuery);
  });

  await Promise.all(updatePromises);
}
