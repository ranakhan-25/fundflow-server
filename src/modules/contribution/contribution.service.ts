import {
  campaignCollection,
  contributionCollection,
  userCollection,
} from "../../config/database.js";
import {
  CAMPAIGN_STATUS,
  CONTRIBUTION_STATUS,
} from "../../config/constants.js";
import { AppError } from "../../utils/AppError.js";
import { toObjectId } from "../../utils/objectId.js";
import { createNotification } from "../../utils/notify.js";
import type { ContributionDoc, UserDoc } from "../../types/models.js";
import type { CreateContributionInput } from "./contribution.validation.js";

// Creates a contribution. Credits are debited from the supporter immediately
// (held) and refunded automatically if the creator later rejects it.
export async function createContribution(
  supporter: UserDoc,
  input: CreateContributionInput,
): Promise<ContributionDoc> {
  const campaign = await campaignCollection.findOne({
    _id: toObjectId(input.campaignId),
  });
  if (!campaign) {
    throw new AppError(404, "Campaign not found.");
  }
  if (campaign.status !== CAMPAIGN_STATUS.APPROVED) {
    throw new AppError(400, "This campaign is not open for contributions.");
  }
  if (campaign.deadline.getTime() <= Date.now()) {
    throw new AppError(400, "This campaign's deadline has passed.");
  }
  if (input.amount < campaign.minimumContribution) {
    throw new AppError(
      400,
      `Minimum contribution for this campaign is ${campaign.minimumContribution} credits.`,
    );
  }
  if (campaign.creatorEmail === supporter.email) {
    throw new AppError(400, "You cannot contribute to your own campaign.");
  }

  // Atomically debit credits only if the supporter has enough. Prevents a
  // race where two concurrent requests both pass a plain balance check.
  const debited = await userCollection.findOneAndUpdate(
    { email: supporter.email, credits: { $gte: input.amount } },
    { $inc: { credits: -input.amount }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!debited) {
    throw new AppError(400, "Insufficient credits for this contribution.");
  }

  const now = new Date();
  const doc: ContributionDoc = {
    campaignId: campaign._id!,
    campaignTitle: campaign.title,
    amount: input.amount,
    supporterEmail: supporter.email,
    supporterName: supporter.name,
    creatorName: campaign.creatorName,
    creatorEmail: campaign.creatorEmail,
    message: input.message ?? "",
    status: CONTRIBUTION_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  };
  const result = await contributionCollection.insertOne(doc);

  await createNotification({
    message: `You received a new contribution of ${input.amount} credits on "${campaign.title}" from ${supporter.name}.`,
    toEmail: campaign.creatorEmail,
    actionRoute: "/dashboard/contributions-review",
  });

  return { ...doc, _id: result.insertedId };
}

export async function getMyContributions(
  supporterEmail: string,
  skip: number,
  limit: number,
) {
  const email = supporterEmail.toLowerCase();
  const [data, total] = await Promise.all([
    contributionCollection
      .find({ supporterEmail: email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    contributionCollection.countDocuments({ supporterEmail: email }),
  ]);
  return { data, total };
}

export async function getMyApprovedContributions(
  supporterEmail: string,
): Promise<ContributionDoc[]> {
  return contributionCollection
    .find({
      supporterEmail: supporterEmail.toLowerCase(),
      status: CONTRIBUTION_STATUS.APPROVED,
    })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getSupporterStats(supporterEmail: string) {
  const email = supporterEmail.toLowerCase();
  const [total, pending, approvedAgg] = await Promise.all([
    contributionCollection.countDocuments({ supporterEmail: email }),
    contributionCollection.countDocuments({
      supporterEmail: email,
      status: CONTRIBUTION_STATUS.PENDING,
    }),
    contributionCollection
      .aggregate([
        {
          $match: {
            supporterEmail: email,
            status: CONTRIBUTION_STATUS.APPROVED,
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
  ]);
  return {
    totalContributions: total,
    pendingContributions: pending,
    totalContributed: (approvedAgg[0]?.total ?? 0) as number,
  };
}

export async function getReviewContributions(
  creatorEmail: string,
): Promise<ContributionDoc[]> {
  return contributionCollection
    .find({
      creatorEmail: creatorEmail.toLowerCase(),
      status: CONTRIBUTION_STATUS.PENDING,
    })
    .sort({ createdAt: -1 })
    .toArray();
}

// Approve: credit the campaign's raised amount and the creator's withdrawable
// balance. Guarded on status:pending so it can only ever run once.
export async function approveContribution(
  id: string,
  creatorEmail: string,
): Promise<ContributionDoc> {
  const contribution = await contributionCollection.findOneAndUpdate(
    {
      _id: toObjectId(id),
      creatorEmail: creatorEmail.toLowerCase(),
      status: CONTRIBUTION_STATUS.PENDING,
    },
    {
      $set: { status: CONTRIBUTION_STATUS.APPROVED, updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
  if (!contribution) {
    throw new AppError(
      404,
      "Pending contribution not found or already processed.",
    );
  }

  await campaignCollection.updateOne(
    { _id: contribution.campaignId },
    { $inc: { amountRaised: contribution.amount }, $set: { updatedAt: new Date() } },
  );
  await userCollection.updateOne(
    { email: contribution.creatorEmail },
    {
      $inc: { raisedCredits: contribution.amount },
      $set: { updatedAt: new Date() },
    },
  );

  await createNotification({
    message: `Your contribution of ${contribution.amount} credits to "${contribution.campaignTitle}" was approved by ${contribution.creatorName}.`,
    toEmail: contribution.supporterEmail,
    actionRoute: "/dashboard/supporter-home",
  });

  return contribution;
}

// Reject: refund the held credits back to the supporter.
export async function rejectContribution(
  id: string,
  creatorEmail: string,
): Promise<ContributionDoc> {
  const contribution = await contributionCollection.findOneAndUpdate(
    {
      _id: toObjectId(id),
      creatorEmail: creatorEmail.toLowerCase(),
      status: CONTRIBUTION_STATUS.PENDING,
    },
    {
      $set: { status: CONTRIBUTION_STATUS.REJECTED, updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
  if (!contribution) {
    throw new AppError(
      404,
      "Pending contribution not found or already processed.",
    );
  }

  await userCollection.updateOne(
    { email: contribution.supporterEmail },
    { $inc: { credits: contribution.amount }, $set: { updatedAt: new Date() } },
  );

  await createNotification({
    message: `Your contribution of ${contribution.amount} credits to "${contribution.campaignTitle}" was rejected by ${contribution.creatorName} and refunded.`,
    toEmail: contribution.supporterEmail,
    actionRoute: "/dashboard/supporter-home",
  });

  return contribution;
}

export async function getContributionById(
  id: string,
): Promise<ContributionDoc> {
  const contribution = await contributionCollection.findOne({
    _id: toObjectId(id),
  });
  if (!contribution) {
    throw new AppError(404, "Contribution not found.");
  }
  return contribution;
}
