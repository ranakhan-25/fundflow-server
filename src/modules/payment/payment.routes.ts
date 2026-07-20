import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import * as paymentController from "./payment.controller.js";
import { checkoutSchema, confirmSchema } from "./payment.validation.js";

const router = Router();

router.get("/packages", paymentController.listPackages);

// ---- Supporter ----
router.post(
  "/checkout",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  validateBody(checkoutSchema),
  paymentController.createCheckoutSession,
);
router.post(
  "/confirm",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  validateBody(confirmSchema),
  paymentController.confirmCheckout,
);
router.post(
  "/dummy",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  validateBody(checkoutSchema),
  paymentController.dummyPurchase,
);
router.get(
  "/mine",
  verifyToken,
  requireRole(ROLES.SUPPORTER),
  paymentController.getMyPayments,
);

export default router;
