import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

type AgentRecord = {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "maintenance" | "error";
  mode: "autonomous" | "supervised" | "training";
  metrics: {
    confidence: number;
    tasksCompleted: number;
    monthlySavings: number;
    lastUpdated?: string;
  };
};

const agents: AgentRecord[] = [
  {
    id: "agent-inventory",
    name: "Inventory Sentinel",
    type: "inventory",
    status: "active",
    mode: "autonomous",
    metrics: {
      confidence: 0.91,
      tasksCompleted: 185,
      monthlySavings: 32000
    }
  },
  {
    id: "agent-qa",
    name: "QA Guardian",
    type: "quality",
    status: "idle",
    mode: "supervised",
    metrics: {
      confidence: 0.84,
      tasksCompleted: 92,
      monthlySavings: 12500
    }
  }
];

const updateStatusInput = z.object({
  agentId: z.string(),
  status: z.enum(["active", "idle", "maintenance", "error"]),
  mode: z.enum(["autonomous", "supervised", "training"]).optional()
});

export const agentRouter = router({
  list: publicProcedure.query(() => ({
    agents,
    metrics: {
      total: agents.length,
      active: agents.filter((agent) => agent.status === "active").length,
      autonomous: agents.filter((agent) => agent.mode === "autonomous").length,
      monthlySavings: agents.reduce((sum, agent) => sum + (agent.metrics.monthlySavings ?? 0), 0)
    }
  })),

  update: publicProcedure.input(updateStatusInput).mutation(({ input }) => {
    const record = agents.find((agent) => agent.id === input.agentId);
    if (!record) {
      throw new Error("Agent not found");
    }
    record.status = input.status;
    if (input.mode) {
      record.mode = input.mode;
    }
    record.metrics = {
      ...record.metrics,
      lastUpdated: new Date().toISOString()
    };
    return record;
  })
});

export type AgentRouter = typeof agentRouter;
