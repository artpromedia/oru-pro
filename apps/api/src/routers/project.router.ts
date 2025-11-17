import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const logRiskInput = z.object({
  projectId: z.string(),
  summary: z.string().min(5),
  severity: z.enum(["low", "medium", "high"]),
  mitigationOwner: z.string().optional()
});

const mockPortfolio = [
  {
    id: "proj-agent-rollout",
    name: "Decision Copilot Rollout",
    health: "on-track",
    opexVariance: -2.2,
    criticalPath: "QA go-live",
    issues: 1
  },
  {
    id: "proj-shopfloor",
    name: "Precision Manufacturing Console",
    health: "at-risk",
    opexVariance: 5.1,
    criticalPath: "Cell controller upgrade",
    issues: 4
  }
];

export const projectRouter = router({
  portfolio: publicProcedure.query(() => ({
    updatedAt: new Date().toISOString(),
    projects: mockPortfolio
  })),

  logRisk: publicProcedure.input(logRiskInput).mutation(({ input }) => ({
    id: `risk-${Date.now()}`,
    status: "captured",
    ...input
  }))
});

export type ProjectRouter = typeof projectRouter;
