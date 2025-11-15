import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const availabilityInput = z.object({
  weekStart: z.string().datetime(),
  projectCode: z.string().optional()
});

const timeEntryInput = z.object({
  workerId: z.string(),
  projectCode: z.string(),
  hours: z.number().positive(),
  workDate: z.string().datetime(),
  costCenter: z.string(),
  activity: z.enum(["PRODUCTION", "PROJECT", "TRAINING", "OTHER"])
});

const laborCostInput = z.object({
  facilityId: z.string(),
  windowDays: z.number().min(1).max(30).default(7)
});

const skillsInput = z.object({
  requiredSkills: z.array(z.string()).min(1),
  minScore: z.number().min(0).max(100).default(70)
});

export const hrmRouter = router({
  getAvailableResources: publicProcedure.input(availabilityInput).query(async ({ input }) => {
    return {
      weekStart: input.weekStart,
      projectCode: input.projectCode ?? "multi",
      resources: [
        { workerId: "W-1024", name: "Ava", skills: ["Cold prep", "HACCP"], availableHours: 32 },
        { workerId: "W-1188", name: "Mateo", skills: ["Sous chef", "Allergen handling"], availableHours: 24 }
      ]
    };
  }),

  recordTimeEntry: publicProcedure.input(timeEntryInput).mutation(async ({ input }) => {
    return {
      entryId: `TE-${Date.now()}`,
      ...input,
      approvalStatus: "PENDING",
      routedTo: input.activity === "PRODUCTION" ? "Shift Supervisor" : "Project PM"
    };
  }),

  calculateLaborCosts: publicProcedure.input(laborCostInput).query(async ({ input }) => {
    return {
      facilityId: input.facilityId,
      windowDays: input.windowDays,
      totalHours: 1840,
      totalCost: 58200,
      overtimeCost: 8200,
      aiInsight: "Increase cross-training on packaging line to offset overtime spikes."
    };
  }),

  skillsMatching: publicProcedure.input(skillsInput).query(async ({ input }) => {
    const candidates = [
      { workerId: "W-1221", name: "Lara", score: 88, skills: ["SAP PP", "Lean", "Automation"] },
      { workerId: "W-1044", name: "Noah", score: 74, skills: ["Cold storage", "Forklift"] }
    ];
    return candidates.filter((candidate) => candidate.score >= input.minScore && input.requiredSkills.every((skill) => candidate.skills.includes(skill) || candidate.skills.join(" ").toLowerCase().includes(skill.toLowerCase())));
  })
});

export type HrmRouter = typeof hrmRouter;
