import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { isStripeEnabled } from "../../config/env.js";
import * as paymentService from "./payment.service.js";
import type { CheckoutInput, ConfirmInput } from "./payment.validation.js";

export const listPackages = catchAsync(async (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 200,
    message: "Credit packages fetched successfully.",
    data: { stripeEnabled: isStripeEnabled, packages: paymentService.listPackages() },
  });
});

export const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { packageId } = req.body as CheckoutInput;
    const data = await paymentService.createCheckoutSession(
      req.user!,
      packageId,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Checkout session created successfully.",
      data,
    });
  },
);

export const confirmCheckout = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.body as ConfirmInput;
    const data = await paymentService.confirmCheckout(sessionId);
    sendResponse(res, {
      statusCode: 200,
      message: "Payment confirmed and credits added successfully.",
      data,
    });
  },
);

export const dummyPurchase = catchAsync(async (req: Request, res: Response) => {
  const { packageId } = req.body as CheckoutInput;
  const data = await paymentService.dummyPurchase(req.user!, packageId);
  sendResponse(res, {
    statusCode: 201,
    message: "Credits purchased successfully.",
    data,
  });
});

export const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const data = await paymentService.getMyPayments(req.user!.email);
  sendResponse(res, {
    statusCode: 200,
    message: "Payment history fetched successfully.",
    data,
  });
});
