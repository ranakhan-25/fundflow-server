import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AppError } from "../../utils/AppError.js";
import * as userService from "./user.service.js";
import type { UpdateRoleInput } from "./user.validation.js";

export const syncUser = catchAsync(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError(401, "Authentication required.");
  }
  const { user, created } = await userService.syncUser(req.auth, req.body);
  sendResponse(res, {
    statusCode: created ? 201 : 200,
    message: created
      ? "Profile created successfully."
      : "Profile already exists.",
    data: user,
  });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 200,
    message: "Current user fetched successfully.",
    data: req.user,
  });
});

export const listUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await userService.listUsers();
  sendResponse(res, {
    statusCode: 200,
    message: "Users fetched successfully.",
    data: users,
  });
});

export const updateUserRole = catchAsync(
  async (req: Request, res: Response) => {
    const { role } = req.body as UpdateRoleInput;
    const user = await userService.updateUserRole(req.params.id as string, role);
    sendResponse(res, {
      statusCode: 200,
      message: "User role updated successfully.",
      data: user,
    });
  },
);

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await userService.deleteUser(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    message: "User removed successfully.",
  });
});
