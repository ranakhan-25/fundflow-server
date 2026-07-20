import { z } from "zod";

export const createContributionSchema = z.object({
  campaignId: z.string().trim().min(1, "campaignId is required"),
  amount: z.coerce.number().positive("Contribution amount must be positive"),
  message: z.string().trim().max(500).optional().default(""),
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;
