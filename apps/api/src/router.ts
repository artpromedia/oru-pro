import { router } from "./trpc.js";
import { inventoryRouter } from "./routers/inventory.router.js";
import { productionRouter } from "./routers/production.router.js";
import { logisticsRouter } from "./routers/logistics.router.js";
import { procurementRouter } from "./routers/procurement.router.js";
import { financeRouter } from "./routers/finance.router.js";
import { hrmRouter } from "./routers/hrm.router.js";

export const appRouter = router({
  inventory: inventoryRouter,
  production: productionRouter,
  logistics: logisticsRouter,
  procurement: procurementRouter,
  finance: financeRouter,
  hrm: hrmRouter
});

export type AppRouter = typeof appRouter;
