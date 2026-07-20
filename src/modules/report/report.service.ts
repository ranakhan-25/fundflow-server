import { campaignCollection, reportCollection } from "../../config/database.js";
import { REPORT_STATUS } from "../../config/constants.js";
import { AppError } from "../../utils/AppError.js";
import { toObjectId } from "../../utils/objectId.js";
import type { ReportDoc, UserDoc } from "../../types/models.js";
import type { CreateReportInput } from "./report.validation.js";

export async function createReport(
  reporter: UserDoc,
  input: CreateReportInput,
): Promise<ReportDoc> {
  const campaign = await campaignCollection.findOne({
    _id: toObjectId(input.campaignId),
  });
  if (!campaign) {
    throw new AppError(404, "Campaign not found.");
  }

  const doc: ReportDoc = {
    campaignId: campaign._id!,
    campaignTitle: campaign.title,
    reporterName: reporter.name,
    reporterEmail: reporter.email,
    reason: input.reason,
    status: REPORT_STATUS.OPEN,
    date: new Date(),
  };
  const result = await reportCollection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getReports(): Promise<ReportDoc[]> {
  return reportCollection.find().sort({ date: -1 }).toArray();
}

export async function resolveReport(id: string): Promise<ReportDoc> {
  const result = await reportCollection.findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { status: REPORT_STATUS.RESOLVED } },
    { returnDocument: "after" },
  );
  if (!result) {
    throw new AppError(404, "Report not found.");
  }
  return result;
}
