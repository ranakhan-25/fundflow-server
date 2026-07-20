import { z } from "zod";

export const createReportSchema = z.object({
  campaignId: z.string().trim().min(1, "campaignId is required"),
  reason: z.string().trim().min(10, "Please describe the reason (min 10 chars)"),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
