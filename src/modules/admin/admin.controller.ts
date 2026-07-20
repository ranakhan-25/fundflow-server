import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import * as adminService from "./admin.service.js";

export const getStats = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminService.getAdminStats();
  sendResponse(res, {
    statusCode: 200,
    message: "Admin statistics fetched successfully.",
    data,
  });
});
