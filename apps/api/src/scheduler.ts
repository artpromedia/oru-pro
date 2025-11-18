import cron from "node-cron";
import { logger } from "./logger.js";
import { prisma } from "./lib/prisma.js";
import { inventoryService } from "./services/inventoryService.js";

let inventorySweepRunning = false;

const getFacilityIdsForSweep = async (): Promise<string[]> => {
  const facilities = await prisma.inventory.findMany({
    select: { facilityId: true },
    distinct: ["facilityId"]
  });

  const ids = facilities
    .map((facility) => facility.facilityId)
    .filter((id): id is string => Boolean(id));

  if (!ids.length) {
    logger.warn("cron: no facilities found for inventory sweep");
  }

  return ids;
};

const runInventorySweep = async () => {
  if (inventorySweepRunning) {
    logger.warn("cron: inventory sweep already running, skipping overlap");
    return;
  }

  inventorySweepRunning = true;
  try {
    const facilityIds = await getFacilityIdsForSweep();
    for (const facilityId of facilityIds) {
      await inventoryService.runScheduledInventoryCheck(facilityId);
    }
    if (!facilityIds.length) {
      logger.debug("cron: inventory sweep skipped because no facilities were available");
    }
  } catch (error) {
    logger.error("cron: inventory sweep failed", error);
  } finally {
    inventorySweepRunning = false;
  }
};

export const scheduleHeartbeat = () => {
  const heartbeatJob = cron.schedule("*/5 * * * *", () => {
    logger.info("cron: inventory heartbeat");
  });

  const inventorySweepJob = cron.schedule("0 * * * *", () => {
    void runInventorySweep();
  });

  return { heartbeatJob, inventorySweepJob };
};
