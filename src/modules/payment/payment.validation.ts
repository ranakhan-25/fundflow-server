import { z } from "zod";

export const checkoutSchema = z.object({
  packageId: z.string().trim().min(1, "packageId is required"),
});

export const confirmSchema = z.object({
  sessionId: z.string().trim().min(1, "sessionId is required"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ConfirmInput = z.infer<typeof confirmSchema>;
