import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { getPagination, sendResponse } from "../../utils/sendResponse.js";
import * as contributionService from "./contribution.service.js";

export const createContribution = catchAsync(
  async (req: Request, res: Response) => {
    const contribution = await contributionService.createContribution(
      req.user!,
      req.body,
    );
    sendResponse(res, {
      statusCode: 201,
      message: "Contribution submitted and is pending creator approval.",
      data: contribution,
    });
  },
);

export const getMyContributions = catchAsync(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const { data, total } = await contributionService.getMyContributions(
      req.user!.email,
      skip,
      limit,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Your contributions fetched successfully.",
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      data,
    });
  },
);

export const getMyApprovedContributions = catchAsync(
  async (req: Request, res: Response) => {
    const data = await contributionService.getMyApprovedContributions(
      req.user!.email,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Approved contributions fetched successfully.",
      data,
    });
  },
);

export const getSupporterStats = catchAsync(
  async (req: Request, res: Response) => {
    const data = await contributionService.getSupporterStats(req.user!.email);
    sendResponse(res, {
      statusCode: 200,
      message: "Supporter statistics fetched successfully.",
      data,
    });
  },
);

export const getReviewContributions = catchAsync(
  async (req: Request, res: Response) => {
    const data = await contributionService.getReviewContributions(
      req.user!.email,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Contributions to review fetched successfully.",
      data,
    });
  },
);

export const getContributionById = catchAsync(
  async (req: Request, res: Response) => {
    const data = await contributionService.getContributionById(
      req.params.id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Contribution fetched successfully.",
      data,
    });
  },
);

export const approveContribution = catchAsync(
  async (req: Request, res: Response) => {
    const data = await contributionService.approveContribution(
      req.params.id as string,
      req.user!.email,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Contribution approved successfully.",
      data,
    });
  },
);

export const rejectContribution = catchAsync(
  async (req: Request, res: Response) => {
    const data = await contributionService.rejectContribution(
      req.params.id as string,
      req.user!.email,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Contribution rejected and the supporter was refunded.",
      data,
    });
  },
);
