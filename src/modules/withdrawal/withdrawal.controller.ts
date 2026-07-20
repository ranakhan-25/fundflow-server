import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import * as withdrawalService from "./withdrawal.service.js";

export const getEarnings = catchAsync(async (req: Request, res: Response) => {
  const data = await withdrawalService.getEarnings(req.user!);
  sendResponse(res, {
    statusCode: 200,
    message: "Earnings fetched successfully.",
    data,
  });
});

export const createWithdrawal = catchAsync(
  async (req: Request, res: Response) => {
    const data = await withdrawalService.createWithdrawal(req.user!, req.body);
    sendResponse(res, {
      statusCode: 201,
      message: "Withdrawal request submitted successfully.",
      data,
    });
  },
);

export const getMyWithdrawals = catchAsync(
  async (req: Request, res: Response) => {
    const data = await withdrawalService.getMyWithdrawals(req.user!.email);
    sendResponse(res, {
      statusCode: 200,
      message: "Withdrawal history fetched successfully.",
      data,
    });
  },
);

export const getPendingWithdrawals = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await withdrawalService.getPendingWithdrawals();
    sendResponse(res, {
      statusCode: 200,
      message: "Pending withdrawal requests fetched successfully.",
      data,
    });
  },
);

export const approveWithdrawal = catchAsync(
  async (req: Request, res: Response) => {
    const data = await withdrawalService.approveWithdrawal(
      req.params.id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Withdrawal marked as paid successfully.",
      data,
    });
  },
);
