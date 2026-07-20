import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import * as reportService from "./report.service.js";

export const createReport = catchAsync(async (req: Request, res: Response) => {
  const data = await reportService.createReport(req.user!, req.body);
  sendResponse(res, {
    statusCode: 201,
    message: "Report submitted successfully. Our admins will review it.",
    data,
  });
});

export const getReports = catchAsync(async (_req: Request, res: Response) => {
  const data = await reportService.getReports();
  sendResponse(res, {
    statusCode: 200,
    message: "Reports fetched successfully.",
    data,
  });
});

export const resolveReport = catchAsync(async (req: Request, res: Response) => {
  const data = await reportService.resolveReport(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: "Report resolved successfully.",
    data,
  });
});
