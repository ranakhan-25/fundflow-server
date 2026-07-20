import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { requireUser } from "../../middleware/auth.js";
import * as notificationController from "./notification.controller.js";

const router = Router();

router.use(verifyToken, requireUser);

router.get("/", notificationController.getMyNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
