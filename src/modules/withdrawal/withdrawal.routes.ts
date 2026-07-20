import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import * as withdrawalController from "./withdrawal.controller.js";
import { createWithdrawalSchema } from "./withdrawal.validation.js";

const router = Router();

// ---- Creator ----
router.get(
  "/earnings",
  verifyToken,
  requireRole(ROLES.CREATOR),
  withdrawalController.getEarnings,
);
router.post(
  "/",
  verifyToken,
  requireRole(ROLES.CREATOR),
  validateBody(createWithdrawalSchema),
  withdrawalController.createWithdrawal,
);
router.get(
  "/mine",
  verifyToken,
  requireRole(ROLES.CREATOR),
  withdrawalController.getMyWithdrawals,
);

// ---- Admin ----
router.get(
  "/pending",
  verifyToken,
  requireRole(ROLES.ADMIN),
  withdrawalController.getPendingWithdrawals,
);
router.patch(
  "/:id/approve",
  verifyToken,
  requireRole(ROLES.ADMIN),
  withdrawalController.approveWithdrawal,
);

export default router;
