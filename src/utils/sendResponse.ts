import type { Response } from "express";

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ResponsePayload<T> {
  statusCode: number;
  success?: boolean;
  message: string;
  data?: T;
  meta?: Meta;
}

export function sendResponse<T>(res: Response, payload: ResponsePayload<T>) {
  const { statusCode, message, data, meta } = payload;
  return res.status(statusCode).json({
    success: payload.success ?? statusCode < 400,
    message,
    ...(meta ? { meta } : {}),
    ...(data !== undefined ? { data } : {}),
  });
}

export function getPagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
