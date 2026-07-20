import { MongoClient, ServerApiVersion } from "mongodb";
import { env } from "./env.js";
import type {
  CampaignDoc,
  ContributionDoc,
  NotificationDoc,
  PaymentDoc,
  ReportDoc,
  UserDoc,
  WithdrawalDoc,
} from "../types/models.js";

const client = new MongoClient(env.dbUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db(env.dbName);

export const userCollection = db.collection<UserDoc>("users");
export const campaignCollection = db.collection<CampaignDoc>("campaigns");
export const contributionCollection =
  db.collection<ContributionDoc>("contributions");
export const withdrawalCollection =
  db.collection<WithdrawalDoc>("withdrawals");
export const paymentCollection = db.collection<PaymentDoc>("payments");
export const notificationCollection =
  db.collection<NotificationDoc>("notifications");
export const reportCollection = db.collection<ReportDoc>("reports");

// In a serverless environment (Vercel) the same container is reused across
// invocations, so we cache the connection promise to avoid reconnecting on
// every request while still awaiting it before the first query.
let connectionPromise: Promise<MongoClient> | null = null;

export async function connectToDatabase(): Promise<MongoClient> {
  if (!connectionPromise) {
    connectionPromise = client.connect().then(async (connected) => {
      await ensureIndexes();
      return connected;
    });
  }
  return connectionPromise;
}

async function ensureIndexes(): Promise<void> {
  await Promise.all([
    userCollection.createIndex({ email: 1 }, { unique: true }),
    campaignCollection.createIndex({ status: 1, deadline: 1 }),
    campaignCollection.createIndex({ creatorEmail: 1 }),
    campaignCollection.createIndex({ amountRaised: -1 }),
    contributionCollection.createIndex({ supporterEmail: 1, status: 1 }),
    contributionCollection.createIndex({ creatorEmail: 1, status: 1 }),
    withdrawalCollection.createIndex({ creatorEmail: 1, status: 1 }),
    paymentCollection.createIndex({ supporterEmail: 1 }),
    notificationCollection.createIndex({ toEmail: 1, time: -1 }),
    reportCollection.createIndex({ status: 1, date: -1 }),
  ]);
}

export { client, db };
