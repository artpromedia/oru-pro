import cors from "cors";
import compression from "compression";
import express, { Router } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createServer } from "node:http";
import { prisma } from "./lib/prisma.js";
import { env } from "./env.js";
import { createContext } from "./context.js";
import { appRouter } from "./routers/index.js";
import { logger } from "./logger.js";
import { scheduleHeartbeat } from "./scheduler.js";
import { initializeRecurringJobs } from "./lib/queue.js";
import { requestLogger } from "./middleware/logging.js";
import { errorHandler } from "./middleware/error.js";
import { inventoryRoutes } from "./routes/inventory.js";
import { healthCheck } from "./lib/monitoring.js";
import { redis } from "./lib/redis.js";
import { initRealtimeServer } from "./websocket/server.js";
import { initializeAgentOrchestrator, type AgentOrchestratorHandle } from "./services/agentOrchestrator.js";
import { inventoryService } from "./services/inventoryService.js";

const app = express();
const httpServer = createServer(app);
const io = initRealtimeServer(httpServer);
inventoryService.setRealtimeServer(io);
let orchestratorHandle: AgentOrchestratorHandle | null = null;

const parseOrigins = () => {
  const configured = process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);
  return configured && configured.length ? configured : ["http://localhost:3000"];
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
);

app.use(cors({
  origin: parseOrigins(),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"]
}));

app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api/", limiter);

const upload = multer({ dest: "uploads/" });
app.post("/uploads", upload.single("document"), (req, res) => {
  res.json({ file: req.file });
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);

app.use("/api/inventory", inventoryRoutes);

const placeholderRoutes = (label: string) => {
  const router = Router();
  router.all("*", (_req, res) => res.status(501).json({ error: `${label} routes coming soon` }));
  return router;
};

app.use("/api/auth", placeholderRoutes("auth"));
app.use("/api/production", placeholderRoutes("production"));
app.use("/api/quality", placeholderRoutes("quality"));
app.use("/api/documents", placeholderRoutes("documents"));
app.use("/api/reports", placeholderRoutes("reports"));
app.use("/api/migration", placeholderRoutes("migration"));
app.use("/api/tenant", placeholderRoutes("tenant"));
app.use("/api/users", placeholderRoutes("users"));
app.use("/api/settings", placeholderRoutes("settings"));

app.get("/health", async (_req, res) => {
  try {
    const report = await healthCheck();
    res.status(report.status === "healthy" ? 200 : 503).json({
      status: report.status === "healthy" ? "healthy" : "unhealthy",
      timestamp: report.timestamp,
      services: {
        database: report.services.database.status === "up" ? "connected" : "down",
        redis: report.services.redis.status === "up" ? "connected" : "down",
        agents: orchestratorHandle ? "ready" : "initializing"
      }
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: (error as Error).message
    });
  }
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: "ready" });
  } catch (error) {
    res.status(503).json({ status: "not ready", error: (error as Error).message });
  }
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? env.PORT ?? 4000);

const start = async () => {
  try {
    await prisma.$connect();
    await redis.ping();
    initializeRecurringJobs();
    scheduleHeartbeat();
    orchestratorHandle = await initializeAgentOrchestrator(io);

    httpServer.listen(PORT, () => {
      logger.info("oru api ready", {
        port: PORT,
        env: process.env.NODE_ENV
      });
    });
  } catch (error) {
    logger.error("api start failed", error);
    process.exit(1);
  }
};

const shutdown = async (signal: NodeJS.Signals) => {
  logger.info(`${signal} received, shutting down`);
  orchestratorHandle?.stop();
  httpServer.close(() => logger.info("http server closed"));
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();

export { app, httpServer as server, io };
