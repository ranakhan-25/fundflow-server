import type { NextFunction, Request, RequestHandler, Response } from "express";

// Wraps an async route handler so rejected promises are forwarded to the
// central error handler instead of crashing the process.
export const catchAsync = (
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
};
