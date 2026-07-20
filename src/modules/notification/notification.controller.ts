import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import * as notificationService from "./notification.service.js";

export const getMyNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const data = await notificationService.getMyNotifications(req.user!.email);
    sendResponse(res, {
      statusCode: 200,
      message: "Notifications fetched successfully.",
      data,
    });
  },
);

export const getUnreadCount = catchAsync(
  async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.email);
    sendResponse(res, {
      statusCode: 200,
      message: "Unread count fetched successfully.",
      data: { count },
    });
  },
);

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req.params.id as string, req.user!.email);
  sendResponse(res, {
    statusCode: 200,
    message: "Notification marked as read.",
  });
});

export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const modified = await notificationService.markAllAsRead(req.user!.email);
  sendResponse(res, {
    statusCode: 200,
    message: "All notifications marked as read.",
    data: { modified },
  });
});
