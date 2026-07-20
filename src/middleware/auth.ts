import type { NextFunction, Request, Response } from "express";
import type { Role } from "../config/constants.js";
import { AppError } from "../utils/AppError.js";

// Ensures the authenticated user has synced their profile into our database.
export function requireUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    return next(
      new AppError(
        403,
        "No profile found for this account. Please complete registration.",
      ),
    );
  }
  next();
}

// Role-based authorization. Usage: requireRole("admin"), requireRole("creator").
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required."));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "You do not have permission to perform this action.",
        ),
      );
    }
    next();
  };
}
