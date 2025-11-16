import type { NextFunction, Request, Response } from "express";
import { logger } from "../logger.js";

interface HttpError extends Error {
  status?: number;
  details?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? 500;
  logger.error("request-error", {
    message: err.message,
    status,
    stack: err.stack,
    details: err.details
  });
  res.status(status).json({
    error: err.message || "Unexpected error",
    details: err.details
  });
};
