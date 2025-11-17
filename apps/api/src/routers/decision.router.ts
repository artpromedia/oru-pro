import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const submitDecisionInput = z.object({
  title: z.string().min(3),
  type: z.enum(["procurement", "qa_release", "production", "strategic"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  requester: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(1)
});

const feed = [
  {
    id: "decision-1",
    title: "Approve cold-chain release",
    requester: "qa.bot",
    status: "pending",
    confidence: 0.82,
    due: new Date(Date.now() + 3_600_000).toISOString()
  },
  {
    id: "decision-2",
    title: "Switch supplier for additive powder",
    requester: "procurement.ai",
    status: "awaiting-data",
    confidence: 0.71,
    due: new Date(Date.now() + 86_400_000).toISOString()
  }
];

export const decisionRouter = router({
  feed: publicProcedure.query(() => ({
    items: feed,
    telemetry: {
      pending: feed.length,
      noiseFiltered: 12,
      avgConfidence: 0.77
    }
  })),

  submit: publicProcedure.input(submitDecisionInput).mutation(({ input }) => ({
    id: `decision-${Date.now()}`,
    status: "pending",
    receivedAt: new Date().toISOString(),
    ...input
  }))
});

export type DecisionRouter = typeof decisionRouter;
