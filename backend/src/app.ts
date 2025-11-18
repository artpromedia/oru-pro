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
import commsRouter from './routes/comms.routes';
import { logger, morganStream } from './utils/logger';
import { commsService } from './services/commsService';
import { presenceService } from './services/presenceService';
import { Prisma } from './lib/prisma';

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

const resolveRealtimeContext = (socket: Socket) => {
  const auth = socket.handshake.auth ?? {};
  const headers = socket.handshake.headers ?? {};
  const tenantId = (auth.tenantId as string) ?? (headers['x-tenant-id'] as string) ?? process.env.DEFAULT_TENANT ?? 'demo';
  const userId = (auth.userId as string) ?? (headers['x-user-id'] as string) ?? `anon-${socket.id}`;
  const userName = (auth.name as string) ?? (headers['x-user-name'] as string) ?? 'Realtime User';
  const avatar = (auth.avatar as string) ?? (headers['x-user-avatar'] as string) ?? null;
  return { tenantId, userId, userName, avatar };
};

const roomFor = (tenantId: string, channelId: string) => `comms:${tenantId}:${channelId}`;

io.on('connection', (socket: Socket) => {
  const context = resolveRealtimeContext(socket);
  logger.info('Socket connection established', { id: socket.id, ...context });

  presenceService.userConnected(context.tenantId, context.userId, context.userName, context.avatar, socket.id);
  socket.join(`presence:${context.tenantId}`);
  io.to(`presence:${context.tenantId}`).emit('comms:presence', presenceService.list(context.tenantId));

  socket.on('channel:join', async ({ channelId }: { channelId: string }) => {
    if (!channelId) return;
    try {
      await commsService.requireChannel(context.tenantId, channelId);
      socket.join(roomFor(context.tenantId, channelId));
      presenceService.markChannel(context.tenantId, context.userId, channelId, 'join');
      const messages = await commsService.getMessages(context.tenantId, channelId, { limit: 50 });
      socket.emit('channel:history', { channelId, messages });
      socket.to(roomFor(context.tenantId, channelId)).emit('channel:activity', {
        channelId,
        userId: context.userId,
        userName: context.userName,
        event: 'join',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn('Failed to join channel', { error: (error as Error).message, channelId });
      socket.emit('channel:error', { channelId, message: (error as Error).message });
    }
  });

  socket.on('channel:leave', ({ channelId }: { channelId: string }) => {
    if (!channelId) return;
    socket.leave(roomFor(context.tenantId, channelId));
    presenceService.markChannel(context.tenantId, context.userId, channelId, 'leave');
  });

  socket.on('message:send', async (payload: { channelId: string; content: string; attachments?: Prisma.JsonValue; metadata?: Prisma.JsonValue; threadParentId?: string }, callback?: (response: unknown) => void) => {
    try {
      if (!payload?.channelId || !payload?.content) {
        throw new Error('channelId and content required');
      }
      const message = await commsService.createMessage(context.tenantId, {
        channelId: payload.channelId,
        authorId: context.userId,
        authorName: context.userName,
        authorAvatar: context.avatar,
        content: payload.content,
        attachments: payload.attachments,
        metadata: payload.metadata,
        threadParentId: payload.threadParentId,
      });
      io.to(roomFor(context.tenantId, payload.channelId)).emit('message:new', message);
      callback?.({ success: true, message });
    } catch (error) {
      callback?.({ success: false, error: (error as Error).message });
    }
  });

  socket.on('message:update', async (payload: { id: string; content: string; attachments?: Prisma.JsonValue; metadata?: Prisma.JsonValue }, callback?: (response: unknown) => void) => {
    try {
      const message = await commsService.editMessage(context.tenantId, {
        messageId: payload.id,
        authorId: context.userId,
        content: payload.content,
  attachments: payload.attachments,
  metadata: payload.metadata,
      });
      io.to(roomFor(context.tenantId, message.channelId)).emit('message:updated', message);
      callback?.({ success: true, message });
    } catch (error) {
      callback?.({ success: false, error: (error as Error).message });
    }
  });

  socket.on('message:delete', async ({ messageId }: { messageId: string }, callback?: (response: unknown) => void) => {
    try {
      const result = await commsService.deleteMessage(context.tenantId, messageId, context.userId);
      io.to(roomFor(context.tenantId, result.channelId)).emit('message:deleted', result);
      callback?.({ success: true, result });
    } catch (error) {
      callback?.({ success: false, error: (error as Error).message });
    }
  });

  socket.on('message:pin', async ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
    try {
      const message = await commsService.pinMessage(context.tenantId, messageId, Boolean(isPinned));
      io.to(roomFor(context.tenantId, message.channelId)).emit('message:updated', message);
    } catch (error) {
      socket.emit('message:error', { messageId, error: (error as Error).message });
    }
  });

  socket.on('message:react', async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    try {
      const message = await commsService.toggleReaction(context.tenantId, messageId, context.userId, context.userName, emoji);
      io.to(roomFor(context.tenantId, message.channelId)).emit('message:updated', message);
    } catch (error) {
      socket.emit('message:error', { messageId, error: (error as Error).message });
    }
  });

  socket.on('user:typing', ({ channelId, isTyping }: { channelId: string; isTyping: boolean }) => {
    if (!channelId) return;
    socket.to(roomFor(context.tenantId, channelId)).emit('user:typing', {
      channelId,
      userId: context.userId,
      userName: context.userName,
      isTyping,
    });
  });

  socket.on('presence:status', ({ status }: { status: 'online' | 'away' | 'busy' | 'offline' }) => {
    presenceService.setStatus(context.tenantId, context.userId, status);
    io.to(`presence:${context.tenantId}`).emit('comms:presence', presenceService.list(context.tenantId));
  });

  socket.on('call:start', ({ channelId, type }: { channelId: string; type: 'audio' | 'video' }) => {
    if (!channelId) return;
    io.to(roomFor(context.tenantId, channelId)).emit('call:incoming', {
      channelId,
      type,
      from: {
        id: context.userId,
        name: context.userName,
        avatar: context.avatar,
      },
      startedAt: new Date().toISOString(),
    });
  });

  socket.on('call:end', ({ channelId }: { channelId: string }) => {
    if (!channelId) return;
    io.to(roomFor(context.tenantId, channelId)).emit('call:ended', {
      channelId,
      userId: context.userId,
      endedAt: new Date().toISOString(),
    });
  });

  socket.on('disconnect', (reason: DisconnectReason) => {
    logger.info('Socket disconnected', { id: socket.id, reason });
    presenceService.userDisconnected(context.tenantId, context.userId, socket.id);
    io.to(`presence:${context.tenantId}`).emit('comms:presence', presenceService.list(context.tenantId));
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
app.use('/api/comms', commsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);

if (require.main === module) {
  server.listen(port, () => {
    logger.info(`Backend listening on port ${port}`);
  });
}

export { app, server, io };
