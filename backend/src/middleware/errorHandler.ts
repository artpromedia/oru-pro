import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  void _next;
  const isHttpError = err instanceof HttpError;
  const statusCode = isHttpError ? err.statusCode : 500;
  const message = isHttpError ? err.message : 'Internal server error';

  logger.error('Request failed', {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    error: err instanceof Error ? err.message : err,
  });

  res.status(statusCode).json({
    success: false,
    message,
    traceId: req.headers['x-request-id'],
    details: isHttpError ? err.details : undefined,
  });
};
