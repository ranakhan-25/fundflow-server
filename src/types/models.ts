import type { ObjectId } from "mongodb";
import type {
  CAMPAIGN_STATUS,
  CONTRIBUTION_STATUS,
  PAYMENT_STATUS,
  REPORT_STATUS,
  Role,
  WITHDRAWAL_STATUS,
} from "../config/constants.js";

type ValueOf<T> = T[keyof T];

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  photoURL: string;
  role: Role;
  credits: number;
  // Credits raised by a creator that are available to withdraw.
  raisedCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignDoc {
  _id?: ObjectId;
  title: string;
  story: string;
  category: string;
  fundingGoal: number;
  minimumContribution: number;
  deadline: Date;
  rewardInfo: string;
  imageUrl: string;
  creatorId: ObjectId;
  creatorName: string;
  creatorEmail: string;
  amountRaised: number;
  status: ValueOf<typeof CAMPAIGN_STATUS>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContributionDoc {
  _id?: ObjectId;
  campaignId: ObjectId;
  campaignTitle: string;
  amount: number;
  supporterEmail: string;
  supporterName: string;
  creatorName: string;
  creatorEmail: string;
  message: string;
  status: ValueOf<typeof CONTRIBUTION_STATUS>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalDoc {
  _id?: ObjectId;
  creatorEmail: string;
  creatorName: string;
  withdrawalCredit: number;
  withdrawalAmount: number;
  paymentSystem: string;
  accountNumber: string;
  status: ValueOf<typeof WITHDRAWAL_STATUS>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDoc {
  _id?: ObjectId;
  supporterEmail: string;
  supporterName: string;
  packageId: string;
  credits: number;
  amountUsd: number;
  provider: string;
  reference: string;
  status: ValueOf<typeof PAYMENT_STATUS>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDoc {
  _id?: ObjectId;
  message: string;
  toEmail: string;
  actionRoute: string;
  read: boolean;
  time: Date;
}

export interface ReportDoc {
  _id?: ObjectId;
  campaignId: ObjectId;
  campaignTitle: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  status: ValueOf<typeof REPORT_STATUS>;
  date: Date;
}
