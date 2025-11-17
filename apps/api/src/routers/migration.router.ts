import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const scheduleInput = z.object({
  waveId: z.string(),
  startDate: z.string().datetime(),
  owner: z.string()
});

const waves = [
  {
    id: "wave-1",
    scope: ["inventory", "procurement"],
    status: "in-flight",
    cutover: new Date(Date.now() + 7 * 86_400_000).toISOString()
  },
  {
    id: "wave-2",
    scope: ["logistics", "planning"],
    status: "design",
    cutover: new Date(Date.now() + 21 * 86_400_000).toISOString()
  }
];

export const migrationRouter = router({
  waves: publicProcedure.query(() => ({ waves })),

  scheduleWave: publicProcedure.input(scheduleInput).mutation(({ input }) => ({
    id: input.waveId,
    status: "scheduled",
    startDate: input.startDate,
    owner: input.owner
  }))
});

export type MigrationRouter = typeof migrationRouter;
