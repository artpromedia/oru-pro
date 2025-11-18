/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Server as HTTPServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { verify } from "jsonwebtoken";

import { env } from "../../env.js";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { logger } from "../../logger.js";

type JwtPayload = {
  userId: string;
  organizationId?: string;
};

interface AuthenticatedSocket extends Socket {
  userId: string;
  organizationId: string;
  channels: Set<string>;
}

type PrismaLikeClient = typeof prisma & Record<string, any>;
const db = prisma as PrismaLikeClient;

export class WebSocketServer {
  private io: Server;
  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();
  private activeRooms: Map<string, Set<string>> = new Map();
  private presenceInterval?: NodeJS.Timeout;

  constructor(server: HTTPServer) {
    this.io = new Server(server, {
      cors: {
        origin: this.resolveOrigins(),
        credentials: true
      },
      transports: ["websocket", "polling"]
    });

    this.initializeMiddleware();
    this.initializeEventHandlers();
    this.startPresenceTracking();
  }

  private resolveOrigins(): string[] {
    const configured = process.env.NEXT_PUBLIC_APP_URL ?? env.NEXT_PUBLIC_SOCKET_URL;
    if (configured) {
      return configured.split(",").map((value) => value.trim()).filter(Boolean);
    }
    return ["http://localhost:3000"];
  }

  private initializeMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          return next(new Error("No token provided"));
        }

        const decoded = verify(token, env.JWT_SECRET) as JwtPayload;
        const userRecord = await db.user?.findUnique?.({
          where: { id: decoded.userId },
          include: { organization: true }
        });

        if (!userRecord && !decoded.organizationId) {
          return next(new Error("User not found"));
        }

        const authSocket = socket as AuthenticatedSocket;
        authSocket.userId = userRecord?.id ?? decoded.userId;
        authSocket.organizationId = userRecord?.organizationId ?? decoded.organizationId ?? userRecord?.organization?.id ?? "default";
        authSocket.channels = new Set<string>();

        next();
      } catch (error) {
        logger.error("Socket authentication failed", error);
        next(new Error("Authentication failed"));
      }
    });
  }

  private initializeEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      logger.info(`socket: user ${authSocket.userId} connected`);

      void this.handleUserConnection(authSocket);

      socket.on("channel:join", (channelId: string) => {
        void this.handleChannelJoin(authSocket, channelId);
      });

      socket.on("channel:leave", (channelId: string) => {
        void this.handleChannelLeave(authSocket, channelId);
      });

      socket.on("message:send", (payload) => {
        void this.handleMessageSend(authSocket, payload);
      });

      socket.on("message:update", (payload) => {
        void this.handleMessageUpdate(authSocket, payload);
      });

      socket.on("message:delete", (payload) => {
        void this.handleMessageDelete(authSocket, payload);
      });

      socket.on("message:react", (payload) => {
        void this.handleMessageReaction(authSocket, payload);
      });

      socket.on("user:typing", (payload) => {
        void this.handleTypingIndicator(authSocket, payload);
      });

      socket.on("call:start", (payload) => {
        void this.handleCallStart(authSocket, payload);
      });

      socket.on("call:signal", (payload) => {
        void this.handleCallSignal(authSocket, payload);
      });

      socket.on("call:end", (payload) => {
        void this.handleCallEnd(authSocket, payload);
      });

      socket.on("screen:start", (payload) => {
        void this.handleScreenShare(authSocket, payload);
      });

      socket.on("file:upload", (payload) => {
        void this.handleFileUpload(authSocket, payload);
      });

      socket.on("presence:update", (status: string) => {
        void this.handlePresenceUpdate(authSocket, status);
      });

      socket.on("inventory:update", (payload) => {
        void this.handleInventoryUpdate(authSocket, payload);
      });

      socket.on("production:alert", (payload) => {
        void this.handleProductionAlert(authSocket, payload);
      });

      socket.on("decision:request", (payload) => {
        void this.handleDecisionRequest(authSocket, payload);
      });

      socket.on("disconnect", () => {
        void this.handleUserDisconnection(authSocket);
      });
    });
  }

  private extractToken(socket: Socket): string | null {
    const fromAuth = socket.handshake.auth?.token;
    if (typeof fromAuth === "string" && fromAuth.length > 0) {
      return fromAuth;
    }

    const header = socket.handshake.headers?.authorization;
    if (header?.startsWith("Bearer ")) {
      return header.slice(7);
    }

    return null;
  }

  private async handleUserConnection(socket: AuthenticatedSocket) {
    const { userId, organizationId } = socket;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);
    this.socketUsers.set(socket.id, userId);

    socket.join(`org:${organizationId}`);

    try {
      const userChannels = await db.channelMember?.findMany?.({
        where: { userId },
        select: { channelId: true }
      });

      (userChannels ?? []).forEach((membership: { channelId: string }) => {
        socket.join(`channel:${membership.channelId}`);
        socket.channels.add(membership.channelId);
      });
    } catch (error) {
      logger.warn("channel auto-join failed", error);
    }

    socket.to(`org:${organizationId}`).emit("user:online", userId);

    socket.emit("init", {
      userId,
      organizationId,
      channels: Array.from(socket.channels),
      onlineUsers: await this.getOnlineUsers(organizationId)
    });

    await redis.setex(`presence:${userId}`, 300, JSON.stringify({
      status: "online",
      lastSeen: new Date().toISOString()
    }));
  }

  private async handleChannelJoin(socket: AuthenticatedSocket, channelId: string) {
    try {
      const membership = await db.channelMember?.findFirst?.({
        where: {
          userId: socket.userId,
          channelId
        }
      });

      if (!membership) {
        socket.emit("error", { message: "Access denied to channel" });
        return;
      }

      socket.join(`channel:${channelId}`);
      socket.channels.add(channelId);

      const messages = await db.message?.findMany?.({
        where: { channelId },
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          reactions: true,
          attachments: true,
          replyTo: { include: { user: true } }
        }
      });

      socket.emit("channel:joined", {
        channelId,
        messages: (messages ?? []).reverse()
      });

      socket.to(`channel:${channelId}`).emit("channel:user_joined", {
        channelId,
        userId: socket.userId
      });

      if (!this.activeRooms.has(channelId)) {
        this.activeRooms.set(channelId, new Set());
      }
      this.activeRooms.get(channelId)!.add(socket.userId);
    } catch (error) {
      logger.error("Error joining channel", error);
      socket.emit("error", { message: "Failed to join channel" });
    }
  }

  private async handleChannelLeave(socket: AuthenticatedSocket, channelId: string) {
    socket.leave(`channel:${channelId}`);
    socket.channels.delete(channelId);

    const room = this.activeRooms.get(channelId);
    room?.delete(socket.userId);

    socket.to(`channel:${channelId}`).emit("channel:user_left", {
      channelId,
      userId: socket.userId
    });
  }

  private async handleMessageSend(socket: AuthenticatedSocket, data: any) {
    try {
      const { channelId, content, attachments, mentions, replyTo } = data ?? {};

      if (!channelId || !socket.channels.has(channelId)) {
        socket.emit("error", { message: "Not in channel" });
        return;
      }

      const message = await db.message?.create?.({
        data: {
          channelId,
          userId: socket.userId,
          content,
          replyToId: replyTo,
          attachments: attachments?.length
            ? {
                create: attachments
              }
            : undefined
        },
        include: {
          user: true,
          attachments: true,
          reactions: true,
          replyTo: { include: { user: true } }
        }
      });

      if (!message) {
        socket.emit("error", { message: "Failed to send message" });
        return;
      }

      if (Array.isArray(mentions) && mentions.length > 0) {
        await this.processMentions(message, mentions);
        await this.sendMentionNotifications(message, mentions);
      }

      this.io.to(`channel:${channelId}`).emit("message:new", message);

      await db.channel?.update?.({
        where: { id: channelId },
        data: {
          lastMessageId: message.id,
          lastActivity: new Date()
        }
      });

      await this.moderateContent(message);
    } catch (error) {
      logger.error("Error sending message", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  }

  private async handleMessageUpdate(socket: AuthenticatedSocket, data: any) {
    try {
      const { messageId, content } = data ?? {};
      const original = await db.message?.findFirst?.({
        where: {
          id: messageId,
          userId: socket.userId
        }
      });

      if (!original) {
        socket.emit("error", { message: "Cannot edit this message" });
        return;
      }

      const updated = await db.message?.update?.({
        where: { id: messageId },
        data: {
          content,
          edited: true,
          editedAt: new Date()
        },
        include: {
          user: true,
          attachments: true,
          reactions: true
        }
      });

      if (updated) {
        this.io.to(`channel:${original.channelId}`).emit("message:updated", updated);
      }
    } catch (error) {
      logger.error("Error updating message", error);
      socket.emit("error", { message: "Failed to update message" });
    }
  }

  private async handleMessageDelete(socket: AuthenticatedSocket, data: any) {
    try {
      const { messageId } = data ?? {};
      const message = await db.message?.findFirst?.({ where: { id: messageId } });

      if (!message) {
        socket.emit("error", { message: "Message not found" });
        return;
      }

      const isOwner = message.userId === socket.userId;
      const isAdmin = await this.isChannelAdmin(socket.userId, message.channelId);

      if (!isOwner && !isAdmin) {
        socket.emit("error", { message: "Cannot delete this message" });
        return;
      }

      await db.message?.update?.({
        where: { id: messageId },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: socket.userId
        }
      });

      this.io.to(`channel:${message.channelId}`).emit("message:deleted", { id: messageId });
    } catch (error) {
      logger.error("Error deleting message", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  }

  private async handleMessageReaction(socket: AuthenticatedSocket, data: any) {
    try {
      const { messageId, emoji } = data ?? {};

      const existing = await db.reaction?.findFirst?.({
        where: {
          messageId,
          userId: socket.userId,
          emoji
        }
      });

      if (existing) {
        await db.reaction?.delete?.({ where: { id: existing.id } });
      } else {
        await db.reaction?.create?.({
          data: {
            messageId,
            userId: socket.userId,
            emoji
          }
        });
      }

      const reactions = await db.reaction?.groupBy?.({
        by: ["emoji"],
        where: { messageId },
        _count: { emoji: true }
      });

      const message = await db.message?.findUnique?.({ where: { id: messageId } });
      if (message) {
        this.io.to(`channel:${message.channelId}`).emit("message:reaction_updated", {
          messageId,
          reactions: reactions ?? []
        });
      }
    } catch (error) {
      logger.error("Error handling reaction", error);
      socket.emit("error", { message: "Failed to add reaction" });
    }
  }

  private async handleTypingIndicator(socket: AuthenticatedSocket, data: any) {
    const { channelId, isTyping } = data ?? {};
    if (!channelId || !socket.channels.has(channelId)) {
      return;
    }

    if (!this.typingUsers.has(channelId)) {
      this.typingUsers.set(channelId, new Set());
    }

    const channelTyping = this.typingUsers.get(channelId)!;
    if (isTyping) {
      channelTyping.add(socket.userId);
    } else {
      channelTyping.delete(socket.userId);
    }

    socket.to(`channel:${channelId}`).emit("user:typing", {
      channelId,
      userId: socket.userId,
      isTyping
    });

    if (isTyping) {
      setTimeout(() => {
        if (channelTyping.delete(socket.userId)) {
          socket.to(`channel:${channelId}`).emit("user:typing", {
            channelId,
            userId: socket.userId,
            isTyping: false
          });
        }
      }, 5000);
    }
  }

  private async handleCallStart(socket: AuthenticatedSocket, data: any) {
    try {
      const { channelId, type } = data ?? {};
      const call = await db.call?.create?.({
        data: {
          channelId,
          initiatorId: socket.userId,
          type,
          status: "ringing"
        }
      });

      socket.to(`channel:${channelId}`).emit("call:incoming", {
        callId: call?.id,
        channelId,
        initiator: socket.userId,
        type
      });
    } catch (error) {
      logger.error("Error starting call", error);
      socket.emit("error", { message: "Failed to start call" });
    }
  }

  private async handleCallSignal(socket: AuthenticatedSocket, data: any) {
    const { to, signal, callId } = data ?? {};
    const targets = this.userSockets.get(to);
    targets?.forEach((socketId) => {
      this.io.to(socketId).emit("call:signal", {
        from: socket.userId,
        signal,
        callId
      });
    });
  }

  private async handleCallEnd(socket: AuthenticatedSocket, data: any) {
    try {
      const { callId } = data ?? {};
      await db.call?.update?.({
        where: { id: callId },
        data: {
          status: "ended",
          endedAt: new Date()
        }
      });

      const call = await db.call?.findUnique?.({ where: { id: callId } });
      if (call) {
        this.io.to(`channel:${call.channelId}`).emit("call:ended", { callId });
      }
    } catch (error) {
      logger.error("Error ending call", error);
      socket.emit("error", { message: "Failed to end call" });
    }
  }

  private async handleScreenShare(socket: AuthenticatedSocket, data: any) {
    const { channelId, isSharing } = data ?? {};
    if (!channelId) return;

    socket.to(`channel:${channelId}`).emit("screen:status", {
      userId: socket.userId,
      isSharing: Boolean(isSharing)
    });
  }

  private async handleFileUpload(socket: AuthenticatedSocket, data: any) {
    try {
      const { channelId, file, messageId } = data ?? {};
      const attachment = await db.attachment?.create?.({
        data: {
          messageId,
          type: file?.type,
          name: file?.name,
          size: file?.size,
          url: file?.url ?? `/files/${file?.id}`,
          uploadedBy: socket.userId
        }
      });

      this.io.to(`channel:${channelId}`).emit("file:uploaded", {
        messageId,
        attachment
      });
    } catch (error) {
      logger.error("Error handling file upload", error);
      socket.emit("error", { message: "Failed to upload file" });
    }
  }

  private async handlePresenceUpdate(socket: AuthenticatedSocket, status: string) {
    const { userId, organizationId } = socket;

    await redis.setex(`presence:${userId}`, 300, JSON.stringify({
      status,
      lastSeen: new Date().toISOString()
    }));

    socket.to(`org:${organizationId}`).emit("presence:updated", {
      userId,
      status
    });
  }

  private async handleInventoryUpdate(socket: AuthenticatedSocket, data: any) {
    const { type, inventoryId, update } = data ?? {};
    socket.to(`org:${socket.organizationId}`).emit("inventory:updated", {
      type,
      inventoryId,
      update,
      timestamp: new Date().toISOString()
    });
  }

  private async handleProductionAlert(socket: AuthenticatedSocket, data: any) {
    const { severity, message, lineId } = data ?? {};
    this.io.to(`org:${socket.organizationId}`).emit("production:alert", {
      severity,
      message,
      lineId,
      timestamp: new Date().toISOString()
    });
  }

  private async handleDecisionRequest(socket: AuthenticatedSocket, data: any) {
    const { decisionId, urgency } = data ?? {};
    const decisionMakers = await this.getDecisionMakers(socket.organizationId);

    decisionMakers.forEach((userId) => {
      const sockets = this.userSockets.get(userId);
      sockets?.forEach((socketId) => {
        this.io.to(socketId).emit("decision:requested", {
          decisionId,
          urgency,
          requestedBy: socket.userId
        });
      });
    });
  }

  private async handleUserDisconnection(socket: AuthenticatedSocket) {
    const { userId, organizationId } = socket;
    const sockets = this.userSockets.get(userId);

    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        socket.to(`org:${organizationId}`).emit("user:offline", userId);

        await redis.setex(`presence:${userId}`, 300, JSON.stringify({
          status: "offline",
          lastSeen: new Date().toISOString()
        }));
      }
    }

    this.typingUsers.forEach((users, channelId) => {
      if (users.delete(userId)) {
        socket.to(`channel:${channelId}`).emit("user:typing", {
          channelId,
          userId,
          isTyping: false
        });
      }
    });

    this.activeRooms.forEach((users) => users.delete(userId));
    this.socketUsers.delete(socket.id);
    logger.info(`socket: user ${userId} disconnected`);
  }

  private async getOnlineUsers(organizationId: string): Promise<string[]> {
    try {
      const users = await db.user?.findMany?.({
        where: { organizationId },
        select: { id: true }
      });

      const online: string[] = [];
      for (const user of users ?? []) {
        const presence = await redis.get(`presence:${user.id}`);
        if (presence) {
          const data = JSON.parse(presence);
          if (data.status === "online") {
            online.push(user.id);
          }
        }
      }
      return online;
    } catch (error) {
      logger.warn("Failed to fetch online users", error);
      return [];
    }
  }

  private async isChannelAdmin(userId: string, channelId: string): Promise<boolean> {
    const membership = await db.channelMember?.findFirst?.({
      where: {
        userId,
        channelId,
        role: "admin"
      }
    });
    return Boolean(membership);
  }

  private async processMentions(message: any, mentions: string[]) {
    for (const username of mentions) {
      const user = await db.user?.findFirst?.({
        where: { name: username }
      });

      if (user) {
        await db.notification?.create?.({
          data: {
            userId: user.id,
            type: "mention",
            title: `${message.user?.name ?? "Someone"} mentioned you`,
            message: message.content?.substring(0, 100) ?? "",
            data: {
              messageId: message.id,
              channelId: message.channelId
            }
          }
        });
      }
    }
  }

  private async sendMentionNotifications(message: any, mentions: string[]) {
    if (!mentions.length) return;
    logger.info(`Sending notifications for mentions: ${mentions.join(", ")}`, {
      messageId: message.id
    });
  }

  private async moderateContent(message: any) {
    logger.info(`Moderating content for message ${message.id}`);
  }

  private async getDecisionMakers(organizationId: string): Promise<string[]> {
    try {
      const users = await db.user?.findMany?.({
        where: {
          organizationId,
          role: {
            permissions: {
              has: "decision.approve"
            }
          }
        },
        select: { id: true }
      });

      if (!users || users.length === 0) {
        const fallback = await db.user?.findMany?.({
          where: { organizationId },
          select: { id: true }
        });
        return (fallback ?? []).map((user: { id: string }) => user.id);
      }

      return users.map((user: { id: string }) => user.id);
    } catch (error) {
      logger.warn("Failed to load decision makers", error);
      return [];
    }
  }

  private startPresenceTracking() {
    this.presenceInterval = setInterval(async () => {
      for (const [userId, sockets] of this.userSockets.entries()) {
        if (sockets.size > 0) {
          await redis.setex(`presence:${userId}`, 300, JSON.stringify({
            status: "online",
            lastSeen: new Date().toISOString()
          }));
        }
      }
    }, 60_000);

    this.presenceInterval.unref?.();
  }

  public broadcast(channel: string, payload: unknown) {
    this.io.to(channel).emit(channel, payload);
  }

  public getIO(): Server {
    return this.io;
  }
}
