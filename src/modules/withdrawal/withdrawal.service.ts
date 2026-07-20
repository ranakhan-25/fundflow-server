import { userCollection, withdrawalCollection } from "../../config/database.js";
import {
  CREDITS_PER_DOLLAR_WITHDRAW,
  MIN_WITHDRAW_CREDITS,
  WITHDRAWAL_STATUS,
} from "../../config/constants.js";
import { AppError } from "../../utils/AppError.js";
import { toObjectId } from "../../utils/objectId.js";
import { createNotification } from "../../utils/notify.js";
import type { UserDoc, WithdrawalDoc } from "../../types/models.js";
import type { CreateWithdrawalInput } from "./withdrawal.validation.js";

function creditsToDollars(credits: number): number {
  return credits / CREDITS_PER_DOLLAR_WITHDRAW;
}

async function getPendingRequestedCredits(email: string): Promise<number> {
  const [agg] = await withdrawalCollection
    .aggregate([
      { $match: { creatorEmail: email, status: WITHDRAWAL_STATUS.PENDING } },
      { $group: { _id: null, total: { $sum: "$withdrawalCredit" } } },
    ])
    .toArray();
  return (agg?.total ?? 0) as number;
}

export async function getEarnings(creator: UserDoc) {
  const email = creator.email.toLowerCase();
  const pendingRequested = await getPendingRequestedCredits(email);
  const raisedCredits = creator.raisedCredits ?? 0;
  const available = raisedCredits - pendingRequested;
  return {
    raisedCredits,
    withdrawableAmount: creditsToDollars(raisedCredits),
    pendingRequestedCredits: pendingRequested,
    availableCredits: available,
    availableAmount: creditsToDollars(available),
    minWithdrawCredits: MIN_WITHDRAW_CREDITS,
    canWithdraw: raisedCredits >= MIN_WITHDRAW_CREDITS && available > 0,
  };
}

export async function createWithdrawal(
  creator: UserDoc,
  input: CreateWithdrawalInput,
): Promise<WithdrawalDoc> {
  const email = creator.email.toLowerCase();
  const raisedCredits = creator.raisedCredits ?? 0;

  if (raisedCredits < MIN_WITHDRAW_CREDITS) {
    throw new AppError(
      400,
      `You need at least ${MIN_WITHDRAW_CREDITS} raised credits to withdraw.`,
    );
  }

  const pendingRequested = await getPendingRequestedCredits(email);
  const available = raisedCredits - pendingRequested;

  if (input.withdrawalCredit > available) {
    throw new AppError(
      400,
      `You can withdraw at most ${available} credits (after pending requests).`,
    );
  }

  const now = new Date();
  const doc: WithdrawalDoc = {
    creatorEmail: email,
    creatorName: creator.name,
    withdrawalCredit: input.withdrawalCredit,
    withdrawalAmount: creditsToDollars(input.withdrawalCredit),
    paymentSystem: input.paymentSystem,
    accountNumber: input.accountNumber,
    status: WITHDRAWAL_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  };
  const result = await withdrawalCollection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getMyWithdrawals(
  creatorEmail: string,
): Promise<WithdrawalDoc[]> {
  return withdrawalCollection
    .find({ creatorEmail: creatorEmail.toLowerCase() })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getPendingWithdrawals(): Promise<WithdrawalDoc[]> {
  return withdrawalCollection
    .find({ status: WITHDRAWAL_STATUS.PENDING })
    .sort({ createdAt: -1 })
    .toArray();
}

// Admin marks a withdrawal as paid: flip status and reduce the creator's
// raised credits by the withdrawn amount.
export async function approveWithdrawal(id: string): Promise<WithdrawalDoc> {
  const withdrawal = await withdrawalCollection.findOneAndUpdate(
    { _id: toObjectId(id), status: WITHDRAWAL_STATUS.PENDING },
    { $set: { status: WITHDRAWAL_STATUS.APPROVED, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!withdrawal) {
    throw new AppError(
      404,
      "Pending withdrawal not found or already processed.",
    );
  }

  await userCollection.updateOne(
    { email: withdrawal.creatorEmail },
    {
      $inc: { raisedCredits: -withdrawal.withdrawalCredit },
      $set: { updatedAt: new Date() },
    },
  );

  await createNotification({
    message: `Your withdrawal of $${withdrawal.withdrawalAmount} (${withdrawal.withdrawalCredit} credits) has been processed.`,
    toEmail: withdrawal.creatorEmail,
    actionRoute: "/dashboard/payment-history",
  });

  return withdrawal;
}
