import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { requireRole, requireUser } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import * as userController from "./user.controller.js";
import { syncUserSchema, updateRoleSchema } from "./user.validation.js";

const router = Router();

// Called right after the client-side auth registration to create/sync the
// profile and grant one-time signup credits.
router.post(
  "/sync",
  verifyToken,
  validateBody(syncUserSchema),
  userController.syncUser,
);

router.get("/me", verifyToken, requireUser, userController.getMe);

// Admin: Manage Users
router.get(
  "/",
  verifyToken,
  requireRole(ROLES.ADMIN),
  userController.listUsers,
);
router.patch(
  "/:id/role",
  verifyToken,
  requireRole(ROLES.ADMIN),
  validateBody(updateRoleSchema),
  userController.updateUserRole,
);
router.delete(
  "/:id",
  verifyToken,
  requireRole(ROLES.ADMIN),
  userController.deleteUser,
);

export default router;
