import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import { migrationService } from "../services/migration/sapMigrationService.js";

const scheduleInput = z.object({
  waveId: z.string(),
  startDate: z.string().datetime(),
  owner: z.string()
});

const migrationConfigInput = z.object({
  organizationId: z.string().min(1),
  source: z.enum(["SAP", "Oracle", "Legacy"]).default("SAP"),
  entities: z.array(z.string().min(1)).min(1),
  mode: z.enum(["full", "incremental"]).default("full"),
  sandbox: z.boolean().default(false),
  options: z
    .object({
      batchSize: z.number().int().positive().max(5000).optional(),
      parallel: z.boolean().optional(),
      validateOnly: z.boolean().optional()
    })
    .default({})
});

const migrationIdInput = z.object({ migrationId: z.string().min(1) });

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
  })),

  startSapMigration: publicProcedure.input(migrationConfigInput).mutation(async ({ input }) => {
    const migrationId = await migrationService.startMigration(input.organizationId, {
      source: input.source,
      entities: input.entities,
      mode: input.mode,
      sandbox: input.sandbox,
      options: input.options
    });

    return {
      migrationId,
      acceptedAt: new Date().toISOString()
    };
  }),

  migrationStatus: publicProcedure.input(migrationIdInput).query(({ input }) => {
    return migrationService.getMigrationStatus(input.migrationId);
  }),

  listMigrations: publicProcedure.query(() => ({ migrations: migrationService.listMigrations() })),

  pauseMigration: publicProcedure.input(migrationIdInput).mutation(async ({ input }) => {
    const progress = await migrationService.pauseMigration(input.migrationId);
    return { migrationId: input.migrationId, progress };
  }),

  resumeMigration: publicProcedure.input(migrationIdInput).mutation(async ({ input }) => {
    const progress = await migrationService.resumeMigration(input.migrationId);
    return { migrationId: input.migrationId, progress };
  })
});

export type MigrationRouter = typeof migrationRouter;
