import { NextResponse } from "next/server";
import { z } from "zod";

import { marketplaceIndex } from "@/app/(dashboard)/forge/builder/marketplace-data";

import { getInstallationCount, recordInstallation } from "../storage";

const installSchema = z.object({
  appId: z.string(),
  workspaceId: z.string().min(2),
  environment: z.enum(["development", "staging", "production"]).default("production"),
  requestedBy: z.string().min(2).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = installSchema.parse(body);

  const marketplaceItem = marketplaceIndex.get(payload.appId);
  if (!marketplaceItem) {
    return NextResponse.json({ error: "Marketplace app not found" }, { status: 404 });
  }

  await new Promise((resolve) => setTimeout(resolve, 600));

  const installationId = `install-${Date.now()}`;
  const deployedAt = new Date().toISOString();
  const workspaceId = payload.workspaceId.trim();
  const requestedBy = payload.requestedBy?.trim() ?? "system";

  await recordInstallation({
    installationId,
    appId: marketplaceItem.app.id,
    workspaceId,
    environment: payload.environment,
    timestamp: deployedAt,
    requestedBy,
    version: marketplaceItem.app.version,
    deploymentUrl: marketplaceItem.app.deployments[0]?.url,
  });

  const recordedInstalls = await getInstallationCount(marketplaceItem.app.id);
  const analytics = {
    ...marketplaceItem.app.analytics,
    installations: marketplaceItem.app.analytics.installations + recordedInstalls,
  };

  return NextResponse.json(
    {
      installationId,
      status: "installed",
      appId: marketplaceItem.app.id,
      appName: marketplaceItem.app.name,
      environment: payload.environment,
      workspaceId,
      version: marketplaceItem.app.version,
      deploymentUrl: `${marketplaceItem.app.deployments[0]?.url}?workspace=${workspaceId}`,
      requestedBy,
      analytics,
      provisioning: {
        startedAt: deployedAt,
        completedAt: deployedAt,
        steps: [
          { label: "Validating subscription", status: "complete" },
          { label: "Provisioning data sources", status: "complete" },
          { label: "Deploying workflows", status: "complete" },
        ],
      },
      timestamp: deployedAt,
    },
    { status: 201 }
  );
}
