import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import * as campaignController from "./campaign.controller.js";
import {
  createCampaignSchema,
  updateCampaignSchema,
} from "./campaign.validation.js";

const router = Router();

// ---- Public (used by home page + explore, even when logged out) ----
router.get("/", campaignController.exploreCampaigns);
router.get("/top", campaignController.getTopFunded);
router.get("/categories", campaignController.getCategories);

// ---- Creator ----
router.post(
  "/",
  verifyToken,
  requireRole(ROLES.CREATOR),
  validateBody(createCampaignSchema),
  campaignController.createCampaign,
);
router.get(
  "/mine",
  verifyToken,
  requireRole(ROLES.CREATOR),
  campaignController.getMyCampaigns,
);
router.get(
  "/mine/stats",
  verifyToken,
  requireRole(ROLES.CREATOR),
  campaignController.getMyStats,
);

// ---- Admin ----
router.get(
  "/admin/pending",
  verifyToken,
  requireRole(ROLES.ADMIN),
  campaignController.getPendingCampaigns,
);
router.get(
  "/admin/all",
  verifyToken,
  requireRole(ROLES.ADMIN),
  campaignController.getAllCampaigns,
);
router.patch(
  "/:id/approve",
  verifyToken,
  requireRole(ROLES.ADMIN),
  campaignController.approveCampaign,
);
router.patch(
  "/:id/reject",
  verifyToken,
  requireRole(ROLES.ADMIN),
  campaignController.rejectCampaign,
);
router.patch(
  "/:id/suspend",
  verifyToken,
  requireRole(ROLES.ADMIN),
  campaignController.suspendCampaign,
);

// ---- Shared / owner + admin ----
router.get("/:id", campaignController.getCampaignById);
router.patch(
  "/:id",
  verifyToken,
  requireRole(ROLES.CREATOR),
  validateBody(updateCampaignSchema),
  campaignController.updateCampaign,
);
router.delete(
  "/:id",
  verifyToken,
  requireRole(ROLES.CREATOR, ROLES.ADMIN),
  campaignController.deleteCampaign,
);

export default router;
