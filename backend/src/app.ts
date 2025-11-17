import http from 'http';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server, Socket, type DisconnectReason } from 'socket.io';
import { Request, Response } from 'express';

import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import operationsRouter from './routes/operations';
import decisionRouter from './routes/decision.routes';
import agentRouter from './routes/agent.routes';
import authRouter from './routes/auth.routes';
import { logger, morganStream } from './utils/logger';

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);

const parseOrigins = () => {
  const configured = process.env.REALTIME_ALLOWED_ORIGINS;
  if (!configured) return undefined;
  const origins = configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length ? origins : undefined;
};

const allowedOrigins = parseOrigins();
const corsOptions = {
  origin: allowedOrigins ?? true,
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    credentials: true,
  },
});

io.on('connection', (socket: Socket) => {
  logger.info('Socket connection established', { id: socket.id });
  socket.on('disconnect', (reason: DisconnectReason) => {
    logger.info('Socket disconnected', { id: socket.id, reason });
  });
});

app.set('io', io);

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: process.env.REQUEST_LIMIT ?? '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(morgan('combined', { stream: morganStream }));

app.get('/livez', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

app.use(authMiddleware);

app.use('/health', healthRouter);
app.use('/api/operations', operationsRouter);
app.use('/api/decisions', decisionRouter);
app.use('/api/agents', agentRouter);
app.use('/api/auth', authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);

if (require.main === module) {
  server.listen(port, () => {
    logger.info(`Backend listening on port ${port}`);
  });
}

export { app, server, io };
