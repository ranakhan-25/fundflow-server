import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import * as reportController from "./report.controller.js";
import { createReportSchema } from "./report.validation.js";

const router = Router();

// ---- Supporter reports a suspicious campaign ----
router.post(
  "/",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  validateBody(createReportSchema),
  reportController.createReport,
);

// ---- Admin ----
router.get(
  "/",
  verifyToken,
  requireRole(ROLES.ADMIN),
  reportController.getReports,
);
router.patch(
  "/:id/resolve",
  verifyToken,
  requireRole(ROLES.ADMIN),
  reportController.resolveReport,
);

export default router;
