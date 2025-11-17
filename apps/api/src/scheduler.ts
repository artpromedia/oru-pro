import cron from "node-cron";
import { logger } from "./logger.js";
import { prisma } from "./lib/prisma.js";
import { inventoryService } from "./services/inventoryService.js";

let inventorySweepRunning = false;

const getOrganizationIdsForSweep = async (): Promise<string[]> => {
  const organizations = await prisma.inventory.findMany({
    select: { organizationId: true },
    distinct: ["organizationId"],
    where: { organizationId: { not: null } }
  });

  const ids = organizations
    .map((org) => org.organizationId)
    .filter((id): id is string => Boolean(id));

  if (!ids.length) {
    logger.warn("cron: no organizations found for inventory sweep");
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
    const organizationIds = await getOrganizationIdsForSweep();
    for (const organizationId of organizationIds) {
      await inventoryService.runScheduledInventoryCheck(organizationId);
    }
    if (!organizationIds.length) {
      logger.debug("cron: inventory sweep skipped because no organizations were available");
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
