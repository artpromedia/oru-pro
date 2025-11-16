import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("http", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration
    });
  });
  next();
};
