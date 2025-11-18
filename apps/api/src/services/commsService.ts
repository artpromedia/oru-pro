import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";

const messageInclude = {
  user: true,
  attachments: true,
  reactions: {
    include: {
      user: true
    }
  },
  _count: {
    select: {
      replies: true
    }
  }
} satisfies Prisma.MessageInclude;

type MessageRecord = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;
type ChannelRecord = Prisma.ChannelGetPayload<{
  include: {
    _count: { select: { members: true } };
    members: { select: { userId: true; unreadCount: true; isMuted: true } };
  };
}>;
type PresenceUserRecord = Prisma.UserGetPayload<{
  include: {
    memberships: {
      select: { channelId: true };
    };
  };
}>;
type ReactionGroup = { emoji: string; users: Array<{ id: string; name: string }> };
type AttachmentPayload = {
  id?: string;
  name?: string | null;
  type?: string | null;
  url: string;
  size?: number | null;
  metadata?: Record<string, unknown> | null;
};

type PaginationParams = { cursor?: string; limit?: number };

type MessageCreationParams = {
  organizationId?: string;
  channelId: string;
  userId?: string;
  content: string;
  attachments?: AttachmentPayload[] | null;
  metadata?: Record<string, unknown> | null;
  threadParentId?: string | null;
};

type MessageUpdateParams = {
  organizationId?: string;
  messageId: string;
  userId?: string;
  content: string;
  attachments?: AttachmentPayload[] | null;
  metadata?: Record<string, unknown> | null;
};

type ErrorLike = Error & { status?: number };

const DEFAULT_ORGANIZATION_ID = process.env.DEFAULT_ORGANIZATION_ID ?? "org-demo";
const DEFAULT_USER_FALLBACK = process.env.DEFAULT_USER_ID;

const asRecord = (value: Prisma.JsonValue | null | undefined) => {
  if (!value || Array.isArray(value)) return null;
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
};

export class CommsService {
  private resolveOrganizationId(organizationId?: string) {
    return organizationId ?? DEFAULT_ORGANIZATION_ID;
  }

  private async resolveUserId(userId: string | undefined, organizationId: string) {
    if (userId) return userId;
    if (DEFAULT_USER_FALLBACK) return DEFAULT_USER_FALLBACK;

    const fallback = await prisma.user.findFirst({
      where: { organizationId },
      select: { id: true }
    });

    if (!fallback) {
      throw Object.assign(new Error("No users available for organization") as ErrorLike, { status: 404 });
    }

    return fallback.id;
  }

  private formatMessage(record: MessageRecord) {
    return {
      id: record.id,
      channelId: record.channelId,
      authorId: record.userId,
      authorName: record.user?.name ?? "System",
      authorAvatar: record.user?.avatarUrl ?? null,
      content: record.content,
      attachments: record.attachments.length
        ? record.attachments.map((attachment) => ({
            id: attachment.id,
            type: (attachment.type ?? "file") as AttachmentPayload["type"],
            name: attachment.name ?? undefined,
            url: attachment.url,
            size: attachment.size ?? undefined,
            metadata: asRecord(attachment.metadata)
          }))
        : null,
      metadata: asRecord(record.metadata),
      isPinned: record.isPinned,
      isRead: record.isRead,
      threadParentId: record.replyToId ?? null,
      threadCount: record._count?.replies ?? 0,
      reactions: this.groupReactions(record),
      editedAt: record.editedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private groupReactions(record: MessageRecord): ReactionGroup[] {
    if (!record.reactions?.length) return [];

    const grouped = new Map<string, ReactionGroup>();
    for (const reaction of record.reactions) {
      const existing = grouped.get(reaction.emoji) ?? { emoji: reaction.emoji, users: [] };
      existing.users.push({ id: reaction.userId, name: reaction.user?.name ?? "Unknown" });
      grouped.set(reaction.emoji, existing);
    }

    return Array.from(grouped.values());
  }

  private async getChannelOrThrow(channelId: string, organizationId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, organizationId, archived: false }
    });

    if (!channel) {
      throw Object.assign(new Error("Channel not found") as ErrorLike, { status: 404 });
    }

    return channel;
  }

  async listChannels(params: { organizationId?: string; userId?: string }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const channels = await prisma.channel.findMany({
      where: { organizationId, archived: false },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { members: true } },
        members: {
          select: { userId: true, unreadCount: true, isMuted: true }
        }
      }
    }) as ChannelRecord[];

    const lastMessageIds = channels
      .map((channel) => channel.lastMessageId)
      .filter((id): id is string => Boolean(id));

    const lastMessages = lastMessageIds.length
      ? await prisma.message.findMany({
          where: { id: { in: lastMessageIds } },
          include: messageInclude
        })
      : [];

    const lastMessageMap = new Map(lastMessages.map((message) => [message.id, this.formatMessage(message)]));
    const userId = params.userId;

    return channels.map((channel) => {
      const membership = userId ? channel.members.find((member) => member.userId === userId) : undefined;
      return {
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        type: channel.type ?? "channel",
        isPrivate: channel.isPrivate,
        topic: channel.topic,
        members: channel._count?.members ?? 0,
        unreadCount: membership?.unreadCount ?? 0,
        isPinned: false,
        isMuted: membership?.isMuted ?? false,
        lastMessage: channel.lastMessageId ? lastMessageMap.get(channel.lastMessageId) : undefined
      };
    });
  }

  async getChannelMessages(params: { organizationId?: string; channelId: string } & PaginationParams) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    await this.getChannelOrThrow(params.channelId, organizationId);

    const messages = await prisma.message.findMany({
      where: {
        channelId: params.channelId,
        channel: { organizationId }
      },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 50,
      ...(params.cursor
        ? {
            skip: 1,
            cursor: { id: params.cursor }
          }
        : {}),
      include: messageInclude
    });

    return messages.reverse().map((message) => this.formatMessage(message));
  }

  async createMessage(params: MessageCreationParams) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);
    await this.getChannelOrThrow(params.channelId, organizationId);

    await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId
        }
      },
      update: { lastReadAt: new Date() },
      create: {
        channelId: params.channelId,
        userId,
        role: "member",
        joinedAt: new Date()
      }
    });

    const message = await prisma.message.create({
      data: {
        channelId: params.channelId,
        userId,
        content: params.content,
        metadata: params.metadata ?? undefined,
        replyToId: params.threadParentId ?? undefined,
        attachments: params.attachments?.length
          ? {
              create: params.attachments.map((attachment) => ({
                name: attachment.name ?? undefined,
                type: attachment.type ?? undefined,
                url: attachment.url,
                size: attachment.size ?? undefined,
                metadata: attachment.metadata ?? undefined,
                uploadedBy: userId
              }))
            }
          : undefined
      },
      include: messageInclude
    });

    await prisma.channel.update({
      where: { id: params.channelId },
      data: {
        lastMessageId: message.id,
        lastActivity: new Date()
      }
    });

    return this.formatMessage(message);
  }

  async updateMessage(params: MessageUpdateParams) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);

    const existing = await prisma.message.findFirst({
      where: { id: params.messageId, channel: { organizationId } },
      include: messageInclude
    });

    if (!existing) {
      throw Object.assign(new Error("Message not found") as ErrorLike, { status: 404 });
    }

    if (existing.userId !== userId) {
      throw Object.assign(new Error("Not authorized to edit message") as ErrorLike, { status: 403 });
    }

    const data: Prisma.MessageUpdateInput = {
      content: params.content,
      metadata: params.metadata ?? existing.metadata,
      edited: true,
      editedAt: new Date()
    };

    if (params.metadata === null) {
      data.metadata = Prisma.JsonNull;
    }

    if (params.attachments) {
      data.attachments = {
        deleteMany: {},
        ...(params.attachments.length
          ? {
              create: params.attachments.map((attachment) => ({
                name: attachment.name ?? undefined,
                type: attachment.type ?? undefined,
                url: attachment.url,
                size: attachment.size ?? undefined,
                metadata: attachment.metadata ?? undefined,
                uploadedBy: userId
              }))
            }
          : {})
      };
    }

    const updated = await prisma.message.update({
      where: { id: params.messageId },
      data,
      include: messageInclude
    });

    return this.formatMessage(updated);
  }

  async deleteMessage(params: { organizationId?: string; messageId: string; userId?: string }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);

    const existing = await prisma.message.findFirst({
      where: { id: params.messageId, channel: { organizationId } },
      select: { id: true, userId: true, channelId: true }
    });

    if (!existing) {
      throw Object.assign(new Error("Message not found") as ErrorLike, { status: 404 });
    }

    if (existing.userId !== userId) {
      throw Object.assign(new Error("Not authorized to delete message") as ErrorLike, { status: 403 });
    }

    await prisma.message.delete({ where: { id: params.messageId } });
    return { id: existing.id, channelId: existing.channelId };
  }

  async toggleReaction(params: { organizationId?: string; messageId: string; userId?: string; emoji: string }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);

    const message = await prisma.message.findFirst({
      where: { id: params.messageId, channel: { organizationId } },
      include: messageInclude
    });

    if (!message) {
      throw Object.assign(new Error("Message not found") as ErrorLike, { status: 404 });
    }

    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: params.messageId,
          userId,
          emoji: params.emoji
        }
      }
    });

    if (existingReaction) {
      await prisma.messageReaction.delete({ where: { id: existingReaction.id } });
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId: params.messageId,
          userId,
          emoji: params.emoji
        }
      });
    }

    const refreshed = await prisma.message.findUnique({
      where: { id: params.messageId },
      include: messageInclude
    });

    if (!refreshed) {
      throw Object.assign(new Error("Message not found") as ErrorLike, { status: 404 });
    }

    return this.formatMessage(refreshed);
  }

  async togglePin(params: { organizationId?: string; messageId: string; userId?: string; isPinned: boolean }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);

    const message = await prisma.message.findFirst({
      where: { id: params.messageId, channel: { organizationId } },
      select: { id: true, userId: true }
    });

    if (!message) {
      throw Object.assign(new Error("Message not found") as ErrorLike, { status: 404 });
    }

    if (message.userId !== userId) {
      throw Object.assign(new Error("Not authorized to pin message") as ErrorLike, { status: 403 });
    }

    const updated = await prisma.message.update({
      where: { id: params.messageId },
      data: { isPinned: params.isPinned },
      include: messageInclude
    });

    return this.formatMessage(updated);
  }

  async getPresence(params: { organizationId?: string }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const users = await prisma.user.findMany({
      where: { organizationId },
      include: {
        memberships: {
          select: { channelId: true }
        }
      }
    }) as PresenceUserRecord[];

    const presenceRecords = await Promise.all(
      users.map(async (user) => {
        const presenceRaw = await redis.get(`presence:${user.id}`);
        const presence = presenceRaw ? JSON.parse(presenceRaw) : null;
        return {
          userId: user.id,
          userName: user.name,
          avatar: user.avatarUrl,
          status: presence?.status ?? "offline",
          lastActive: presence?.lastSeen ?? user.updatedAt.toISOString(),
          channels: user.memberships.map((membership) => membership.channelId)
        };
      })
    );

    return presenceRecords;
  }
}

export const commsService = new CommsService();
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";

const db = prisma as unknown as Record<string, any>;

const messageInclude = {
  user: true,
  attachments: true,
  reactions: {
    include: {
      user: true
    }
  },
  _count: {
    select: {
      replies: true
    }
  }
} as const;

type MessageRecord = {
  id: string;
  channelId: string;
  userId: string;
  user?: { name?: string | null; avatarUrl?: string | null } | null;
  content: string;
  attachments: Array<{
    id: string;
    name?: string | null;
    type?: string | null;
    size?: number | null;
    url: string;
    metadata?: Record<string, unknown> | null;
  }>;
  metadata?: Record<string, unknown> | null;
  isPinned: boolean;
  isRead: boolean;
  replyToId?: string | null;
  _count?: { replies?: number } | null;
  reactions: Array<{ emoji: string; userId: string; user?: { name?: string | null } | null }>;
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
type ChannelRecord = {
  id: string;
  name: string;
  slug: string;
  type?: string | null;
  isPrivate: boolean;
  topic?: string | null;
  lastMessageId?: string | null;
  _count?: { members?: number } | null;
  members: Array<{ userId: string; unreadCount: number; isMuted: boolean }>;
};
type ReactionGroup = { emoji: string; users: Array<{ id: string; name: string }> };
type AttachmentPayload = {
  id?: string;
  name?: string | null;
  type?: string | null;
  url: string;
  size?: number | null;
  metadata?: Record<string, unknown> | null;
};

type PresenceUserRecord = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  updatedAt: Date;
  memberships: Array<{ channelId: string }>;
};

const DEFAULT_ORGANIZATION_ID = process.env.DEFAULT_ORGANIZATION_ID ?? "org-demo";
const DEFAULT_USER_FALLBACK = process.env.DEFAULT_USER_ID;

export class CommsService {
  private resolveOrganizationId(organizationId?: string) {
    return organizationId ?? DEFAULT_ORGANIZATION_ID;
  }

  private async resolveUserId(userId: string | undefined, organizationId: string) {
    if (userId) return userId;
    if (DEFAULT_USER_FALLBACK) return DEFAULT_USER_FALLBACK;

    const fallback = await db.user.findFirst({
      where: { organizationId },
      select: { id: true }
    });

    if (!fallback) {
      throw new Error("No users available for organization");
    }

    return fallback.id;
  }

  private formatMessage(record: MessageRecord) {
    return {
      id: record.id,
      channelId: record.channelId,
      authorId: record.userId,
      authorName: record.user?.name ?? "System",
      authorAvatar: record.user?.avatarUrl ?? null,
      content: record.content,
      attachments: record.attachments.length
        ? record.attachments.map((attachment) => ({
            id: attachment.id,
            type: (attachment.type ?? "file") as AttachmentPayload["type"],
            name: attachment.name ?? undefined,
            url: attachment.url,
            size: attachment.size ?? undefined,
            metadata: attachment.metadata ? (attachment.metadata as Record<string, unknown>) : undefined
          }))
        : null,
      metadata: record.metadata ? (record.metadata as Record<string, unknown>) : null,
      isPinned: record.isPinned,
      isRead: record.isRead,
      threadParentId: record.replyToId ?? null,
      threadCount: record._count?.replies ?? 0,
      reactions: this.groupReactions(record),
      editedAt: record.editedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private groupReactions(record: MessageRecord): ReactionGroup[] {
    if (!record.reactions?.length) return [];

    const grouped = new Map<string, ReactionGroup>();
    for (const reaction of record.reactions) {
      const existing = grouped.get(reaction.emoji) ?? { emoji: reaction.emoji, users: [] };
      existing.users.push({ id: reaction.userId, name: reaction.user?.name ?? "Unknown" });
      grouped.set(reaction.emoji, existing);
    }

    return Array.from(grouped.values());
  }

  private async getChannelOrThrow(channelId: string, organizationId: string) {
    const channel = await db.channel.findFirst({
      where: { id: channelId, organizationId, archived: false }
    });

    if (!channel) {
      throw Object.assign(new Error("Channel not found"), { status: 404 });
    }

    return channel;
  }

  async listChannels(params: { organizationId?: string; userId?: string }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = params.userId ? params.userId : undefined;

    const channels = await db.channel.findMany({
      where: { organizationId, archived: false },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { members: true } },
        members: {
          select: { userId: true, unreadCount: true, isMuted: true }
        }
      }
    }) as ChannelRecord[];

    const lastMessageIds = channels.map((channel: ChannelRecord) => channel.lastMessageId).filter((id): id is string => Boolean(id));
    const lastMessages = lastMessageIds.length
      ? await db.message.findMany({
          where: { id: { in: lastMessageIds } },
          include: messageInclude
        })
      : [];
    const typedLastMessages = lastMessages as MessageRecord[];
    const lastMessageMap = new Map(typedLastMessages.map((message: MessageRecord) => [message.id, this.formatMessage(message)]));

    return channels.map((channel: ChannelRecord) => {
      const membership = userId ? channel.members.find((member) => member.userId === userId) : undefined;
      return {
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        type: channel.type ?? "channel",
        isPrivate: channel.isPrivate,
        topic: channel.topic,
        members: channel._count?.members ?? 0,
        unreadCount: membership?.unreadCount ?? 0,
        isPinned: false,
        isMuted: membership?.isMuted ?? false,
        lastMessage: channel.lastMessageId ? lastMessageMap.get(channel.lastMessageId) : undefined
      };
    });
  }

  async getChannelMessages(params: { organizationId?: string; channelId: string; cursor?: string; limit?: number }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    await this.getChannelOrThrow(params.channelId, organizationId);

    const messages = await db.message.findMany({
      where: {
        channelId: params.channelId,
        channel: { organizationId }
      },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 50,
      ...(params.cursor
        ? {
            skip: 1,
            cursor: { id: params.cursor }
          }
        : {}),
      include: messageInclude
    }) as MessageRecord[];

    return messages.reverse().map((message: MessageRecord) => this.formatMessage(message));
  }

  async createMessage(params: {
    organizationId?: string;
    channelId: string;
    userId?: string;
    content: string;
    attachments?: AttachmentPayload[] | null;
    metadata?: Record<string, unknown> | null;
    threadParentId?: string | null;
  }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);
    await this.getChannelOrThrow(params.channelId, organizationId);

    await db.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId
        }
      },
      update: { lastReadAt: new Date() },
      create: {
        channelId: params.channelId,
        userId,
        role: "member",
        joinedAt: new Date()
      }
    });

    const message = await db.message.create({
      data: {
        channelId: params.channelId,
        userId,
        content: params.content,
        metadata: params.metadata ?? undefined,
        replyToId: params.threadParentId ?? undefined,
        attachments: params.attachments?.length
          ? {
              create: params.attachments.map((attachment) => ({
                name: attachment.name ?? undefined,
                type: attachment.type ?? undefined,
                url: attachment.url,
                size: attachment.size ?? undefined,
                metadata: attachment.metadata ?? undefined,
                uploadedBy: userId
              }))
            }
          : undefined
      },
      include: messageInclude
    }) as MessageRecord;

    await db.channel.update({
      where: { id: params.channelId },
      data: {
        lastMessageId: message.id,
        lastActivity: new Date()
      }
    });

    return this.formatMessage(message);
  }

  async updateMessage(params: {
    organizationId?: string;
    messageId: string;
    userId?: string;
    content: string;
    attachments?: AttachmentPayload[] | null;
    metadata?: Record<string, unknown> | null;
  }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);

    const existing = await db.message.findFirst({
      where: { id: params.messageId, channel: { organizationId } },
      include: messageInclude
    }) as MessageRecord | null;

    if (!existing) {
      throw Object.assign(new Error("Message not found"), { status: 404 });
    }

    if (existing.userId !== userId) {
      throw Object.assign(new Error("Not authorized to edit message"), { status: 403 });
    }

    const data: Record<string, unknown> = {
      content: params.content,
      edited: true,
      editedAt: new Date()
    };

    if (params.metadata !== undefined) {
      data.metadata = params.metadata;
    }

    if (params.attachments) {
      data.attachments = {
        deleteMany: {},
        ...(params.attachments.length
          ? {
              create: params.attachments.map((attachment) => ({
                name: attachment.name ?? undefined,
                type: attachment.type ?? undefined,
                url: attachment.url,
                size: attachment.size ?? undefined,
                metadata: attachment.metadata ?? undefined,
                uploadedBy: userId
              }))
            }
          : {})
      };
    }

    const updated = await db.message.update({
      where: { id: params.messageId },
      data,
      include: messageInclude
    }) as MessageRecord;

    return this.formatMessage(updated);
  }

  async deleteMessage(params: { organizationId?: string; messageId: string; userId?: string }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);

    const existing = await db.message.findFirst({
      where: { id: params.messageId, channel: { organizationId } },
      select: { id: true, userId: true, channelId: true }
    });

    if (!existing) {
      throw Object.assign(new Error("Message not found"), { status: 404 });
    }

    if (existing.userId !== userId) {
      throw Object.assign(new Error("Not authorized to delete message"), { status: 403 });
    }

    await db.message.delete({ where: { id: params.messageId } });
    return { id: existing.id, channelId: existing.channelId };
  }

  async toggleReaction(params: { organizationId?: string; messageId: string; userId?: string; emoji: string }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);

    const message = await db.message.findFirst({
      where: { id: params.messageId, channel: { organizationId } },
      include: messageInclude
    }) as MessageRecord | null;

    if (!message) {
      throw Object.assign(new Error("Message not found"), { status: 404 });
    }

    const existingReaction = await db.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: params.messageId,
          userId,
          emoji: params.emoji
        }
      }
    });

    if (existingReaction) {
      await db.messageReaction.delete({ where: { id: existingReaction.id } });
    } else {
      await db.messageReaction.create({
        data: {
          messageId: params.messageId,
          userId,
          emoji: params.emoji
        }
      });
    }

    const refreshed = await db.message.findUnique({
      where: { id: params.messageId },
      include: messageInclude
    }) as MessageRecord | null;

    if (!refreshed) {
      throw Object.assign(new Error("Message not found"), { status: 404 });
    }

    return this.formatMessage(refreshed);
  }

  async togglePin(params: { organizationId?: string; messageId: string; userId?: string; isPinned: boolean }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const userId = await this.resolveUserId(params.userId, organizationId);

    const message = await db.message.findFirst({
      where: { id: params.messageId, channel: { organizationId } },
      select: { id: true, userId: true }
    });

    if (!message) {
      throw Object.assign(new Error("Message not found"), { status: 404 });
    }

    if (message.userId !== userId) {
      throw Object.assign(new Error("Not authorized to pin message"), { status: 403 });
    }

    const updated = await db.message.update({
      where: { id: params.messageId },
      data: { isPinned: params.isPinned },
      include: messageInclude
    }) as MessageRecord;

    return this.formatMessage(updated);
  }

  async getPresence(params: { organizationId?: string }) {
    const organizationId = this.resolveOrganizationId(params.organizationId);
    const users = await db.user.findMany({
      where: { organizationId },
      include: {
        memberships: {
          select: { channelId: true }
        }
      }
    }) as PresenceUserRecord[];

    const presenceRecords = await Promise.all(
      users.map(async (user: PresenceUserRecord) => {
        const presenceRaw = await redis.get(`presence:${user.id}`);
        const presence = presenceRaw ? JSON.parse(presenceRaw) : null;
        return {
          userId: user.id,
          userName: user.name,
          avatar: user.avatarUrl,
          status: presence?.status ?? "offline",
          lastActive: presence?.lastSeen ?? user.updatedAt.toISOString(),
          channels: user.memberships.map((membership: { channelId: string }) => membership.channelId)
        };
      })
    );

    return presenceRecords;
  }
}

export const commsService = new CommsService();
