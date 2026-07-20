import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { getPagination, sendResponse } from "../../utils/sendResponse.js";
import { CAMPAIGN_STATUS, ROLES } from "../../config/constants.js";
import * as campaignService from "./campaign.service.js";

export const createCampaign = catchAsync(
  async (req: Request, res: Response) => {
    const campaign = await campaignService.createCampaign(req.user!, req.body);
    sendResponse(res, {
      statusCode: 201,
      message:
        "Campaign submitted successfully and is pending admin approval.",
      data: campaign,
    });
  },
);

export const exploreCampaigns = catchAsync(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const { data, total } = await campaignService.exploreCampaigns({
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      minGoal: req.query.minGoal as string | undefined,
      maxGoal: req.query.maxGoal as string | undefined,
      sort: req.query.sort as string | undefined,
      page,
      limit,
      skip,
    });
    sendResponse(res, {
      statusCode: 200,
      message: "Campaigns fetched successfully.",
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      data,
    });
  },
);

export const getTopFunded = catchAsync(async (_req: Request, res: Response) => {
  const data = await campaignService.getTopFundedCampaigns(6);
  sendResponse(res, {
    statusCode: 200,
    message: "Top funded campaigns fetched successfully.",
    data,
  });
});

export const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const data = await campaignService.getCategories();
  sendResponse(res, {
    statusCode: 200,
    message: "Categories fetched successfully.",
    data,
  });
});

export const getMyCampaigns = catchAsync(async (req: Request, res: Response) => {
  const data = await campaignService.getCampaignsByCreator(req.user!.email);
  sendResponse(res, {
    statusCode: 200,
    message: "Your campaigns fetched successfully.",
    data,
  });
});

export const getMyStats = catchAsync(async (req: Request, res: Response) => {
  const data = await campaignService.getCreatorStats(req.user!.email);
  sendResponse(res, {
    statusCode: 200,
    message: "Creator statistics fetched successfully.",
    data,
  });
});

export const getCampaignById = catchAsync(
  async (req: Request, res: Response) => {
    const campaign = await campaignService.getCampaignById(
      req.params.id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Campaign fetched successfully.",
      data: campaign,
    });
  },
);

export const updateCampaign = catchAsync(
  async (req: Request, res: Response) => {
    const campaign = await campaignService.updateCampaign(
      req.params.id as string,
      req.user!.email,
      req.body,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Campaign updated successfully.",
      data: campaign,
    });
  },
);

export const deleteCampaign = catchAsync(
  async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === ROLES.ADMIN;
    await campaignService.deleteCampaign(
      req.params.id as string,
      req.user!.email,
      isAdmin,
    );
    sendResponse(res, {
      statusCode: 200,
      message:
        "Campaign deleted successfully and approved supporters were refunded.",
    });
  },
);

// ---- Admin ----

export const getPendingCampaigns = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await campaignService.getCampaignsByStatus(
      CAMPAIGN_STATUS.PENDING,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Pending campaigns fetched successfully.",
      data,
    });
  },
);

export const getAllCampaigns = catchAsync(
  async (req: Request, res: Response) => {
    const data = await campaignService.getCampaignsByStatus(
      req.query.status as string | undefined,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Campaigns fetched successfully.",
      data,
    });
  },
);

export const approveCampaign = catchAsync(
  async (req: Request, res: Response) => {
    const campaign = await campaignService.setCampaignStatus(
      req.params.id as string,
      CAMPAIGN_STATUS.APPROVED,
      `Your campaign "%TITLE%" has been approved and is now live.`,
      "/dashboard/my-campaigns",
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Campaign approved successfully.",
      data: campaign,
    });
  },
);

export const rejectCampaign = catchAsync(
  async (req: Request, res: Response) => {
    const campaign = await campaignService.setCampaignStatus(
      req.params.id as string,
      CAMPAIGN_STATUS.REJECTED,
      `Your campaign "%TITLE%" has been rejected by the admin.`,
      "/dashboard/my-campaigns",
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Campaign rejected.",
      data: campaign,
    });
  },
);

export const suspendCampaign = catchAsync(
  async (req: Request, res: Response) => {
    const campaign = await campaignService.setCampaignStatus(
      req.params.id as string,
      CAMPAIGN_STATUS.SUSPENDED,
      `Your campaign "%TITLE%" has been suspended following a report.`,
      "/dashboard/my-campaigns",
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Campaign suspended.",
      data: campaign,
    });
  },
);
