import { z } from "zod";

// withdrawalAmount is derived on the server (20 credits = $1), so the client
// value is intentionally not trusted here.
export const createWithdrawalSchema = z.object({
  withdrawalCredit: z.coerce
    .number()
    .int("Credits must be a whole number")
    .positive("Credits to withdraw must be positive"),
  paymentSystem: z.string().trim().min(1, "Payment system is required"),
  accountNumber: z.string().trim().min(3, "Account number is required"),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
