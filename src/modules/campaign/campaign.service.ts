import type { Document, Filter } from "mongodb";
import {
  campaignCollection,
  contributionCollection,
  userCollection,
} from "../../config/database.js";
import { CAMPAIGN_STATUS } from "../../config/constants.js";
import { AppError } from "../../utils/AppError.js";
import { toObjectId } from "../../utils/objectId.js";
import { createNotification } from "../../utils/notify.js";
import type { CampaignDoc, UserDoc } from "../../types/models.js";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
} from "./campaign.validation.js";

interface ExploreQuery {
  search?: string;
  category?: string;
  minGoal?: string;
  maxGoal?: string;
  sort?: string;
  page: number;
  limit: number;
  skip: number;
}

export async function createCampaign(
  creator: UserDoc & { _id: import("mongodb").ObjectId },
  input: CreateCampaignInput,
): Promise<CampaignDoc> {
  const now = new Date();
  const doc: CampaignDoc = {
    title: input.title,
    story: input.story,
    category: input.category,
    fundingGoal: input.fundingGoal,
    minimumContribution: input.minimumContribution,
    deadline: input.deadline,
    rewardInfo: input.rewardInfo,
    imageUrl: input.imageUrl,
    creatorId: creator._id,
    creatorName: creator.name,
    creatorEmail: creator.email,
    amountRaised: 0,
    status: CAMPAIGN_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  };
  const result = await campaignCollection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

// Explore campaigns: only approved + not past deadline. Uses the aggregation
// framework for efficient filtering, sorting and pagination in one round trip.
export async function exploreCampaigns(query: ExploreQuery) {
  const match: Document = {
    status: CAMPAIGN_STATUS.APPROVED,
    deadline: { $gt: new Date() },
  };

  if (query.search) {
    match.title = { $regex: query.search, $options: "i" };
  }
  if (query.category) {
    match.category = query.category;
  }
  const goalFilter: Document = {};
  if (query.minGoal) goalFilter.$gte = Number(query.minGoal);
  if (query.maxGoal) goalFilter.$lte = Number(query.maxGoal);
  if (Object.keys(goalFilter).length > 0) {
    match.fundingGoal = goalFilter;
  }

  const sortStage: Document = (() => {
    switch (query.sort) {
      case "mostFunded":
        return { amountRaised: -1 };
      case "deadline":
        return { deadline: 1 };
      case "goalHigh":
        return { fundingGoal: -1 };
      case "goalLow":
        return { fundingGoal: 1 };
      default:
        return { createdAt: -1 };
    }
  })();

  const [result] = await campaignCollection
    .aggregate([
      { $match: match },
      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: query.skip },
            { $limit: query.limit },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ])
    .toArray();

  const data = (result?.data ?? []) as CampaignDoc[];
  const total = (result?.meta?.[0]?.total ?? 0) as number;
  return { data, total };
}

export async function getTopFundedCampaigns(limit = 6): Promise<CampaignDoc[]> {
  return campaignCollection
    .find({ status: CAMPAIGN_STATUS.APPROVED })
    .sort({ amountRaised: -1 })
    .limit(limit)
    .toArray();
}

export async function getCategories(): Promise<string[]> {
  return campaignCollection.distinct("category", {
    status: CAMPAIGN_STATUS.APPROVED,
  });
}

export async function getCampaignById(id: string): Promise<CampaignDoc> {
  const campaign = await campaignCollection.findOne({ _id: toObjectId(id) });
  if (!campaign) {
    throw new AppError(404, "Campaign not found.");
  }
  return campaign;
}

export async function getCampaignsByCreator(
  creatorEmail: string,
): Promise<CampaignDoc[]> {
  return campaignCollection
    .find({ creatorEmail: creatorEmail.toLowerCase() })
    .sort({ deadline: -1 })
    .toArray();
}

export async function getCreatorStats(creatorEmail: string) {
  const email = creatorEmail.toLowerCase();
  const now = new Date();
  const [totalCampaigns, activeCampaigns, raisedAgg] = await Promise.all([
    campaignCollection.countDocuments({ creatorEmail: email }),
    campaignCollection.countDocuments({
      creatorEmail: email,
      deadline: { $gt: now },
    }),
    campaignCollection
      .aggregate([
        { $match: { creatorEmail: email } },
        { $group: { _id: null, total: { $sum: "$amountRaised" } } },
      ])
      .toArray(),
  ]);

  return {
    totalCampaigns,
    activeCampaigns,
    totalRaised: (raisedAgg[0]?.total ?? 0) as number,
  };
}

async function assertOwnership(
  id: string,
  creatorEmail: string,
): Promise<CampaignDoc> {
  const campaign = await getCampaignById(id);
  if (campaign.creatorEmail !== creatorEmail.toLowerCase()) {
    throw new AppError(403, "You can only manage your own campaigns.");
  }
  return campaign;
}

export async function updateCampaign(
  id: string,
  creatorEmail: string,
  input: UpdateCampaignInput,
): Promise<CampaignDoc> {
  await assertOwnership(id, creatorEmail);
  const updates = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(updates).length === 0) {
    throw new AppError(400, "No valid fields provided to update.");
  }
  const result = await campaignCollection.findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result as CampaignDoc;
}

// Deletes a campaign and refunds every approved supporter their contributed
// credits, then reverses those credits from the creator's raised balance.
export async function deleteCampaign(
  id: string,
  actorEmail: string,
  isAdmin: boolean,
): Promise<void> {
  const _id = toObjectId(id);
  const campaign = isAdmin
    ? await getCampaignById(id)
    : await assertOwnership(id, actorEmail);

  const approved = await contributionCollection
    .find({ campaignId: _id, status: "approved" })
    .toArray();

  for (const contribution of approved) {
    await userCollection.updateOne(
      { email: contribution.supporterEmail },
      { $inc: { credits: contribution.amount }, $set: { updatedAt: new Date() } },
    );
    await createNotification({
      message: `The campaign "${campaign.title}" was removed and your contribution of ${contribution.amount} credits was refunded.`,
      toEmail: contribution.supporterEmail,
      actionRoute: "/dashboard/my-contributions",
    });
  }

  const totalRefunded = approved.reduce((sum, c) => sum + c.amount, 0);
  if (totalRefunded > 0) {
    await userCollection.updateOne(
      { email: campaign.creatorEmail },
      {
        $inc: { raisedCredits: -totalRefunded },
        $set: { updatedAt: new Date() },
      },
    );
  }

  await contributionCollection.deleteMany({ campaignId: _id });
  await campaignCollection.deleteOne({ _id });
}

// Admin listing helpers
export async function getCampaignsByStatus(
  status?: string,
): Promise<CampaignDoc[]> {
  const filter: Filter<CampaignDoc> = status
    ? { status: status as CampaignDoc["status"] }
    : {};
  return campaignCollection.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function setCampaignStatus(
  id: string,
  status: (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS],
  notifyMessage: string,
  actionRoute: string,
): Promise<CampaignDoc> {
  const result = await campaignCollection.findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) {
    throw new AppError(404, "Campaign not found.");
  }
  await createNotification({
    message: notifyMessage.replace("%TITLE%", result.title),
    toEmail: result.creatorEmail,
    actionRoute,
  });
  return result;
}
