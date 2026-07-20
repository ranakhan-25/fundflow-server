import { z } from "zod";
import { ROLES } from "../../config/constants.js";

// Only supporter/creator can be chosen at registration. Admin is bootstrapped
// via ADMIN_EMAILS or promoted by an existing admin.
export const syncUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120).optional(),
  email: z.string().trim().email("A valid email is required").optional(),
  photoURL: z.string().trim().url("Profile picture must be a valid URL").optional(),
  role: z
    .enum([ROLES.SUPPORTER, ROLES.CREATOR])
    .optional()
    .default(ROLES.SUPPORTER),
});

export const updateRoleSchema = z.object({
  role: z.enum([ROLES.SUPPORTER, ROLES.CREATOR, ROLES.ADMIN]),
});

export type SyncUserInput = z.infer<typeof syncUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
