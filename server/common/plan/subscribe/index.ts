import { BillingCycle } from "@21n/shared-types/subscription.type";
import { performQueryOnMasterDb } from "$lib/server/surrealHelpers";
import { PaymentProvider } from "$lib/shared/types/plan.type";
import { generateSHA256Hash } from "$lib/shared/utils/crypto.utils";
import { Agent } from "../../account/account.type";
import { InternalServerError, ValidationError } from "../../errors";
import { createPayment, createSubscription } from "../dodoPaymentProvider";
import { resolveDodoProductId, resolvePlanQuery } from "../plan.utils";

export async function subscribe(body: any, agent: Agent) {
  if (!body) throw new ValidationError("No body provided");
  if (!body.action) {
    return await newSubscription(body, agent);
  }
}

async function newSubscription(body: any, agent: Agent) {
  const { plan, cycle, context, product, billing, provider } = body;
  if (!plan) throw new ValidationError("No plan provided");
  if (!cycle) throw new ValidationError("No cycle provided");
  const userDataResult = await performQueryOnMasterDb(
    resolvePlanQuery(agent.id)
  );
  if (!userDataResult || !userDataResult[0])
    throw new ValidationError("User not found");
  const user = userDataResult[0].result?.[0];

  if (!user || !user.userPlan) throw new InternalServerError("User not found");

  let discount = 0;
  const discountData = user.userPlan.discount;
  if (discountData.first) {
    discount = discountData.first;
  }
  let productId = "";
  if (provider) {
    productId = `app.${product}.${plan}.${cycle}`;
  } else {
    const isTest = process.env.ENV === "dev";
    productId = resolveDodoProductId({
      plan,
      cycle,
      discount,
      product,
      isTest
    });

    if (!productId) throw new InternalServerError("Product not found");
  }

  const nonce = await generateSHA256Hash(
    `${agent.id}-${productId}-${new Date().getTime()}`
  );
  const transaction = await createTransaction({
    productId,
    userId: agent.id,
    plan,
    cycle,
    discount,
    nonce,
    provider: provider ?? PaymentProvider.SELF,
    status: "pending"
  });

  let transactionId = "";
  if (Array.isArray(transaction) && transaction.length > 0) {
    transactionId = transaction[0].result?.[0]?.id;
    console.log({ transactionId });
    if (!transactionId)
      throw new InternalServerError("Transaction not created");
  }
  if (provider) {
    return {
      nonce
    };
  }
  const returnUrl = context.origin + "/pay?nonce=" + nonce;
  let payment;
  if (cycle === BillingCycle.MONTHLY) {
    payment = await createSubscription({
      email: billing.email ?? user.context.oauthData.email,
      name: billing.name ?? user.nickName,
      billing,
      productId,
      returnUrl
    });
  } else {
    payment = await createPayment({
      email: billing.email ?? user.context.oauthData.email,
      name: billing.name ?? user.nickName,
      billing,
      productId,
      returnUrl
    });
  }
  console.log({ payment, returnUrl });

  if (!payment || !payment.payment_link) {
    throw new InternalServerError("Payment not created");
  }
  const updateResult = await updateTransaction(transactionId, {
    dodoPayment: payment
  });
  console.log({ updateResult, nonce, link: payment.payment_link });
  return {
    nonce,
    paymentLink: payment.payment_link
  };
}

async function createTransaction(params: {
  productId: string;
  userId: string;
  plan: string;
  cycle: string;
  discount: number;
  nonce: string;
  provider?: string;
  status: "pending" | "completed" | "cancelled" | "failed";
}) {
  const query = `
    INSERT INTO transaction [{ userId: user:${params.userId}, productId: "${params.productId}", plan: "${params.plan}", cycle: "${params.cycle}", discount: ${params.discount}, status: "${params.status}", createdAt: time::now(), nonce: "${params.nonce}", provider: "${params.provider}"}]`;
  const transaction = await performQueryOnMasterDb(query);
  return transaction;
}

async function updateTransaction(id: string, props: any) {
  const query = `UPDATE ${id} MERGE ${JSON.stringify(props)}`;
  const transaction = await performQueryOnMasterDb(query);
  return transaction;
}
