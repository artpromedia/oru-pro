import { router } from "../trpc.js";
import { authRouter } from "./auth.router.js";
import { inventoryRouter } from "./inventory.router.js";
import { productionRouter } from "./production.router.js";
import { procurementRouter } from "./procurement.router.js";
import { logisticsRouter } from "./logistics.router.js";
import { qaRouter } from "./qa.router.js";
import { projectRouter } from "./project.router.js";
import { decisionRouter } from "./decision.router.js";
import { financeRouter } from "./finance.router.js";
import { hrmRouter } from "./hrm.router.js";
import { agentRouter } from "./agent.router.js";
import { migrationRouter } from "./migration.router.js";

export const appRouter = router({
  auth: authRouter,
  inventory: inventoryRouter,
  production: productionRouter,
  procurement: procurementRouter,
  logistics: logisticsRouter,
  qa: qaRouter,
  project: projectRouter,
  decision: decisionRouter,
  finance: financeRouter,
  hcm: hrmRouter,
  agent: agentRouter,
  migration: migrationRouter
});

export type AppRouter = typeof appRouter;
