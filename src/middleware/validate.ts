import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

// Validates and replaces req.body with the parsed/typed result.
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error);
    }
    req.body = result.data as Request["body"];
    next();
  };
}
