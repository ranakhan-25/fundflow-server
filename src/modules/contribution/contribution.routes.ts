import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import * as contributionController from "./contribution.controller.js";
import { createContributionSchema } from "./contribution.validation.js";

const router = Router();

// ---- Supporter ----
router.post(
  "/",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  validateBody(createContributionSchema),
  contributionController.createContribution,
);
router.get(
  "/mine",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  contributionController.getMyContributions,
);
router.get(
  "/mine/approved",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  contributionController.getMyApprovedContributions,
);
router.get(
  "/mine/stats",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  contributionController.getSupporterStats,
);

// ---- Creator ----
router.get(
  "/review",
  verifyToken,
  requireRole(ROLES.CREATOR),
  contributionController.getReviewContributions,
);
router.patch(
  "/:id/approve",
  verifyToken,
  requireRole(ROLES.CREATOR),
  contributionController.approveContribution,
);
router.patch(
  "/:id/reject",
  verifyToken,
  requireRole(ROLES.CREATOR),
  contributionController.rejectContribution,
);

// ---- Shared (view single contribution detail in a modal) ----
router.get(
  "/:id",
  verifyToken,
  requireRole(ROLES.CREATOR, ROLES.SUPPORTER, ROLES.ADMIN),
  contributionController.getContributionById,
);

export default router;
