import cors from "cors";
import express, { type Request, type Response } from "express";
import http from "node:http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import multer from "multer";
import { env } from "./env.js";
import { createContext } from "./context.js";
import { appRouter } from "./router.js";
import { logger } from "./logger.js";
import { scheduleHeartbeat } from "./scheduler.js";
import { inventoryRoutes } from "./routes/inventory.js";
import { initRealtimeServer } from "./websocket/server.js";

const app = express();
const server = http.createServer(app);
initRealtimeServer(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
type UploadRequest = Request & { file?: UploadedFile };

app.post("/uploads", upload.single("document"), (req, res: Response) => {
  const typedReq = req as UploadRequest;
  res.json({ file: typedReq.file });
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);

app.use("/api/inventory", inventoryRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", gpt5Codex: process.env.GPT_5_1_CODEX_ENABLED === "true" });
});

server.listen(env.PORT, () => {
  logger.info(`api listening on ${env.PORT}`);
});

scheduleHeartbeat();
