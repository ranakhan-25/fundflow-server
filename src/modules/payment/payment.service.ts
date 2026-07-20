import { paymentCollection, userCollection } from "../../config/database.js";
import { env, isStripeEnabled } from "../../config/env.js";
import { getStripe } from "../../config/stripe.js";
import {
  CREDIT_PACKAGES,
  PAYMENT_STATUS,
} from "../../config/constants.js";
import { AppError } from "../../utils/AppError.js";
import type { PaymentDoc, UserDoc } from "../../types/models.js";

function findPackage(packageId: string) {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new AppError(400, "Invalid credit package selected.");
  }
  return pkg;
}

async function recordPayment(
  supporter: UserDoc,
  pkg: { id: string; credits: number; priceUsd: number },
  provider: string,
  reference: string,
  status: (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS],
): Promise<PaymentDoc> {
  const now = new Date();
  const doc: PaymentDoc = {
    supporterEmail: supporter.email,
    supporterName: supporter.name,
    packageId: pkg.id,
    credits: pkg.credits,
    amountUsd: pkg.priceUsd,
    provider,
    reference,
    status,
    createdAt: now,
    updatedAt: now,
  };
  const result = await paymentCollection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

// Credits the supporter exactly once for a given payment reference.
async function creditIfUnpaid(reference: string): Promise<PaymentDoc | null> {
  const payment = await paymentCollection.findOneAndUpdate(
    { reference, status: PAYMENT_STATUS.PENDING },
    { $set: { status: PAYMENT_STATUS.PAID, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!payment) {
    return null;
  }
  await userCollection.updateOne(
    { email: payment.supporterEmail },
    { $inc: { credits: payment.credits }, $set: { updatedAt: new Date() } },
  );
  return payment;
}

export function listPackages() {
  return CREDIT_PACKAGES;
}

export async function createCheckoutSession(
  supporter: UserDoc,
  packageId: string,
) {
  if (!isStripeEnabled) {
    throw new AppError(
      501,
      "Stripe is not configured. Use the dummy purchase endpoint instead.",
    );
  }
  const pkg = findPackage(packageId);
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: supporter.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${pkg.credits} FundFlow Credits` },
          unit_amount: pkg.priceUsd * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      supporterEmail: supporter.email,
      packageId: pkg.id,
      credits: String(pkg.credits),
    },
    success_url: `${env.clientUrl}/dashboard/purchase-credit?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/dashboard/purchase-credit?canceled=true`,
  });

  await recordPayment(
    supporter,
    pkg,
    "stripe",
    session.id,
    PAYMENT_STATUS.PENDING,
  );

  return { id: session.id, url: session.url };
}

// Called by the client after returning from Stripe Checkout.
export async function confirmCheckout(sessionId: string): Promise<PaymentDoc> {
  if (!isStripeEnabled) {
    throw new AppError(501, "Stripe is not configured.");
  }
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new AppError(400, "Payment has not been completed.");
  }

  const payment = await creditIfUnpaid(sessionId);
  if (!payment) {
    const existing = await paymentCollection.findOne({ reference: sessionId });
    if (existing) {
      return existing;
    }
    throw new AppError(404, "Payment record not found.");
  }
  return payment;
}

// Dummy fallback for environments without Stripe. Immediately credits the
// supporter and stores a paid payment record.
export async function dummyPurchase(
  supporter: UserDoc,
  packageId: string,
): Promise<PaymentDoc> {
  const pkg = findPackage(packageId);
  const reference = `dummy_${Date.now()}_${supporter.email}`;
  const payment = await recordPayment(
    supporter,
    pkg,
    "dummy",
    reference,
    PAYMENT_STATUS.PENDING,
  );
  const credited = await creditIfUnpaid(reference);
  return credited ?? payment;
}

export async function getMyPayments(
  supporterEmail: string,
): Promise<PaymentDoc[]> {
  return paymentCollection
    .find({ supporterEmail: supporterEmail.toLowerCase() })
    .sort({ createdAt: -1 })
    .toArray();
}
