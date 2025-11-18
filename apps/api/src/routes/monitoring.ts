import { Router, type Request } from "express";
import { z } from "zod";
import { monitoringService } from "../services/monitoringService.js";

const router = Router();

const alertSchema = z.object({
  organizationId: z.string().min(1),
  type: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  source: z.string().optional(),
  context: z.record(z.any()).optional()
});

const limitSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(25)
});

const resolveOrganizationId = (req: Request) => {
  const queryValue = typeof req.query.organizationId === "string" ? req.query.organizationId : undefined;
  const headerValue = req.get("x-tenant-id") ?? req.get("x-organization-id") ?? undefined;
  return queryValue ?? headerValue;
};

router.get("/realtime", async (req, res) => {
  try {
    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is required" });
    }

    const metrics = await monitoringService.getCachedRealTimeMetrics(organizationId);
    return res.json(metrics);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load metrics", error: (error as Error).message });
  }
});

router.get("/system", async (_req, res) => {
  try {
    const snapshot = await monitoringService.getSystemSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load system status", error: (error as Error).message });
  }
});

router.get("/alerts", async (req, res) => {
  try {
    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is required" });
    }

    const { limit } = limitSchema.parse(req.query);
    const [recent, active] = await Promise.all([
      monitoringService.getRecentAlerts(organizationId, limit),
      monitoringService.getActiveAlertsSnapshot(organizationId)
    ]);

    return res.json({ recent, active });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load alerts", error: (error as Error).message });
  }
});

router.post("/alerts", async (req, res) => {
  try {
    const fallbackOrg = resolveOrganizationId(req);
    const payload = alertSchema.parse({ ...req.body, organizationId: req.body.organizationId ?? fallbackOrg });
    const result = await monitoringService.createAlert(payload);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid alert payload", issues: error.flatten() });
    }
    return res.status(500).json({ message: "Failed to create alert", error: (error as Error).message });
  }
});

export { router as monitoringRoutes };
