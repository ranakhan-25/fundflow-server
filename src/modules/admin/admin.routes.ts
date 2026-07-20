import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { requireRole } from "../../middleware/auth.js";
import { ROLES } from "../../config/constants.js";
import * as adminController from "./admin.controller.js";

const router = Router();

router.get(
  "/stats",
  verifyToken,
  requireRole(ROLES.ADMIN),
  adminController.getStats,
);

export default router;
