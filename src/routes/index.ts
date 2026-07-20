import { Router } from "express";
import userRoutes from "../modules/user/user.routes.js";
import campaignRoutes from "../modules/campaign/campaign.routes.js";
import contributionRoutes from "../modules/contribution/contribution.routes.js";
import withdrawalRoutes from "../modules/withdrawal/withdrawal.routes.js";
import paymentRoutes from "../modules/payment/payment.routes.js";
import notificationRoutes from "../modules/notification/notification.routes.js";
import reportRoutes from "../modules/report/report.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

const router = Router();

const modules = [
  { path: "/users", handler: userRoutes },
  { path: "/campaigns", handler: campaignRoutes },
  { path: "/contributions", handler: contributionRoutes },
  { path: "/withdrawals", handler: withdrawalRoutes },
  { path: "/payments", handler: paymentRoutes },
  { path: "/notifications", handler: notificationRoutes },
  { path: "/reports", handler: reportRoutes },
  { path: "/admin", handler: adminRoutes },
];

for (const mod of modules) {
  router.use(mod.path, mod.handler);
}

export default router;
