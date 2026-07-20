import { z } from "zod";

export const createCampaignSchema = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(160),
    story: z.string().trim().min(20, "Story must be at least 20 characters"),
    category: z.string().trim().min(2, "Category is required").max(60),
    fundingGoal: z.coerce.number().positive("Funding goal must be positive"),
    minimumContribution: z.coerce
      .number()
      .positive("Minimum contribution must be positive"),
    deadline: z.coerce.date(),
    rewardInfo: z.string().trim().min(1, "Reward info is required"),
    imageUrl: z.string().trim().url("Campaign image must be a valid URL"),
  })
  .refine((data) => data.minimumContribution <= data.fundingGoal, {
    message: "Minimum contribution cannot exceed the funding goal",
    path: ["minimumContribution"],
  })
  .refine((data) => data.deadline.getTime() > Date.now(), {
    message: "Deadline must be in the future",
    path: ["deadline"],
  });

// Creators may only edit these fields on an existing campaign.
export const updateCampaignSchema = z.object({
  title: z.string().trim().min(5).max(160).optional(),
  story: z.string().trim().min(20).optional(),
  rewardInfo: z.string().trim().min(1).optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
