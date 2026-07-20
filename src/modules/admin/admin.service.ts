import {
  campaignCollection,
  contributionCollection,
  paymentCollection,
  reportCollection,
  userCollection,
  withdrawalCollection,
} from "../../config/database.js";
import {
  CAMPAIGN_STATUS,
  PAYMENT_STATUS,
  REPORT_STATUS,
  ROLES,
  WITHDRAWAL_STATUS,
} from "../../config/constants.js";

export async function getAdminStats() {
  const [
    totalSupporters,
    totalCreators,
    creditsAgg,
    paymentsAgg,
    pendingCampaigns,
    pendingWithdrawals,
    openReports,
    totalCampaigns,
    totalContributions,
  ] = await Promise.all([
    userCollection.countDocuments({ role: ROLES.SUPPORTER }),
    userCollection.countDocuments({ role: ROLES.CREATOR }),
    userCollection
      .aggregate([{ $group: { _id: null, total: { $sum: "$credits" } } }])
      .toArray(),
    paymentCollection
      .aggregate([
        { $match: { status: PAYMENT_STATUS.PAID } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: "$amountUsd" },
          },
        },
      ])
      .toArray(),
    campaignCollection.countDocuments({ status: CAMPAIGN_STATUS.PENDING }),
    withdrawalCollection.countDocuments({ status: WITHDRAWAL_STATUS.PENDING }),
    reportCollection.countDocuments({ status: REPORT_STATUS.OPEN }),
    campaignCollection.estimatedDocumentCount(),
    contributionCollection.estimatedDocumentCount(),
  ]);

  return {
    totalSupporters,
    totalCreators,
    totalAvailableCredits: (creditsAgg[0]?.total ?? 0) as number,
    totalPaymentsProcessed: (paymentsAgg[0]?.count ?? 0) as number,
    totalPaymentsAmountUsd: (paymentsAgg[0]?.amount ?? 0) as number,
    pendingCampaigns,
    pendingWithdrawals,
    openReports,
    totalCampaigns,
    totalContributions,
  };
}
