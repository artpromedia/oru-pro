import cron from "node-cron";
import { logger } from "./logger.js";

export const scheduleHeartbeat = () =>
  cron.schedule("*/5 * * * *", () => {
    logger.info("cron: inventory heartbeat");
  });
