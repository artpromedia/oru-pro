import { Prisma, prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';

export type ChannelSummary = {
  id: string;
  name: string;
  slug: string;
  type: string;
  isPrivate: boolean;
  topic?: string | null;
  members: number;
  unreadCount: number;
  lastMessage?: MessageDTO;
  isPinned: boolean;
  isMuted: boolean;
};

export type MessageDTO = {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  attachments?: Prisma.JsonValue | null;
  metadata?: Prisma.JsonValue | null;
  isPinned: boolean;
  isRead: boolean;
  threadParentId?: string | null;
  threadCount: number;
  reactions: Array<{
    emoji: string;
    users: Array<{ id: string; name: string }>;
  }>;
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReactionRecord = Prisma.CommsReactionGetPayload<Record<string, never>>;

export type CreateMessageInput = {
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  attachments?: Prisma.JsonValue | null;
  metadata?: Prisma.JsonValue | null;
  threadParentId?: string | null;
};

export type UpdateMessageInput = {
  messageId: string;
  authorId: string;
  content: string;
  attachments?: Prisma.JsonValue | null;
  metadata?: Prisma.JsonValue | null;
};

const messageRelations = { reactions: true, threadMessages: true } as const;

const mapMessage = (message: Prisma.CommsMessageGetPayload<{ include: typeof messageRelations }>): MessageDTO => ({
  id: message.id,
  channelId: message.channelId,
  authorId: message.authorId,
  authorName: message.authorName,
  authorAvatar: message.authorAvatar,
  content: message.content,
  attachments: message.attachments,
  metadata: message.metadata,
  isPinned: message.isPinned,
  isRead: message.isRead,
  threadParentId: message.threadParentId,
  threadCount: message.threadMessages.length,
  reactions: aggregateReactions(message.reactions),
  editedAt: message.editedAt?.toISOString() ?? null,
  createdAt: message.createdAt.toISOString(),
  updatedAt: message.updatedAt.toISOString(),
});

const aggregateReactions = (reactions: ReactionRecord[]) => {
  const grouped = new Map<string, { emoji: string; users: Array<{ id: string; name: string }> }>();
  reactions.forEach((reaction) => {
    const existing = grouped.get(reaction.emoji) ?? { emoji: reaction.emoji, users: [] };
    existing.users.push({ id: reaction.userId, name: reaction.userName });
    grouped.set(reaction.emoji, existing);
  });
  return Array.from(grouped.values());
};

const resolveTenant = (tenantId?: string) => tenantId ?? 'demo';

const asJsonInput = (value?: Prisma.JsonValue | null) => {
  if (value === undefined) return undefined;
  return value === null ? Prisma.JsonNull : value;
};

class CommsService {
  async listChannels(tenantId?: string, userId?: string): Promise<ChannelSummary[]> {
    const channels = await prisma.commsChannel.findMany({
      where: {
        organizationId: resolveTenant(tenantId),
        ...(userId ? { members: { some: { userId } } } : {}),
      },
      include: {
        members: userId ? { where: { userId }, take: 1 } : false,
        _count: { select: { members: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { reactions: true, threadMessages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      slug: channel.slug,
      type: channel.type,
      isPrivate: channel.isPrivate,
      topic: channel.topic,
      members: channel._count.members,
      unreadCount: Array.isArray(channel.members) && channel.members.length ? channel.members[0]?.unreadCount ?? 0 : 0,
      lastMessage: channel.messages[0] ? mapMessage(channel.messages[0]) : undefined,
      isPinned: Boolean(channel.pinnedMetadata),
      isMuted: Array.isArray(channel.members) && channel.members.length ? channel.members[0]?.isMuted ?? false : false,
    }));
  }

  async getChannelDetails(tenantId: string, channelId: string) {
    const channel = await prisma.commsChannel.findFirst({
      where: { id: channelId, organizationId: resolveTenant(tenantId) },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new HttpError(404, 'Channel not found');
    }

    return channel;
  }

  async getMessages(tenantId: string, channelId: string, options?: { cursor?: string; limit?: number }) {
    const limit = Math.min(options?.limit ?? 50, 200);
    const cursorDate = options?.cursor ? new Date(options.cursor) : undefined;

  const messages = await prisma.commsMessage.findMany({
      where: {
        channelId,
        channel: { organizationId: resolveTenant(tenantId) },
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
  include: messageRelations,
    });

    return messages.reverse().map(mapMessage);
  }

  async createMessage(tenantId: string, input: CreateMessageInput) {
    const channel = await this.requireChannel(tenantId, input.channelId);

    await prisma.commsChannelMember.upsert({
      where: { channelId_userId: { channelId: channel.id, userId: input.authorId } },
      create: {
        channelId: channel.id,
        userId: input.authorId,
        userName: input.authorName,
        userAvatar: input.authorAvatar ?? undefined,
      },
      update: {
        userName: input.authorName,
        userAvatar: input.authorAvatar ?? undefined,
      },
    });

    const message = await prisma.commsMessage.create({
      data: {
        channelId: input.channelId,
        authorId: input.authorId,
        authorName: input.authorName,
        authorAvatar: input.authorAvatar,
        content: input.content,
        attachments: asJsonInput(input.attachments),
        metadata: asJsonInput(input.metadata),
        threadParentId: input.threadParentId,
      },
      include: messageRelations,
    });

    await prisma.commsChannel.update({ where: { id: channel.id }, data: { updatedAt: new Date() } });

    return mapMessage(message);
  }

  async editMessage(tenantId: string, input: UpdateMessageInput) {
    const message = await this.requireMessage(tenantId, input.messageId);
    if (message.authorId !== input.authorId) {
      throw new HttpError(403, 'Only message author can edit content');
    }

    const updated = await prisma.commsMessage.update({
      where: { id: message.id },
      data: {
        content: input.content,
        attachments: asJsonInput(input.attachments),
        metadata: asJsonInput(input.metadata),
        editedAt: new Date(),
      },
      include: messageRelations,
    });

    return mapMessage(updated);
  }

  async deleteMessage(tenantId: string, messageId: string, requesterId: string) {
    const message = await this.requireMessage(tenantId, messageId);
    if (message.authorId !== requesterId) {
      throw new HttpError(403, 'Only message author can delete content');
    }

    await prisma.commsMessage.delete({ where: { id: message.id } });
    return { id: message.id, channelId: message.channelId };
  }

  async toggleReaction(tenantId: string, messageId: string, userId: string, userName: string, emoji: string) {
    const message = await this.requireMessage(tenantId, messageId);
    const existing = await prisma.commsReaction.findUnique({
      where: {
        messageId_emoji_userId: {
          messageId: message.id,
          emoji,
          userId,
        },
      },
    });

    if (existing) {
      await prisma.commsReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.commsReaction.create({ data: { messageId: message.id, emoji, userId, userName } });
    }

    const refreshed = await prisma.commsMessage.findUnique({
      where: { id: message.id },
      include: messageRelations,
    });

    if (!refreshed) {
      throw new HttpError(404, 'Message not found after reaction update');
    }

    return mapMessage(refreshed);
  }

  async pinMessage(tenantId: string, messageId: string, isPinned: boolean) {
    const message = await this.requireMessage(tenantId, messageId);
    const updated = await prisma.commsMessage.update({
      where: { id: message.id },
      data: { isPinned },
      include: messageRelations,
    });
    return mapMessage(updated);
  }

  async requireChannel(tenantId: string, channelId: string) {
    const channel = await prisma.commsChannel.findFirst({ where: { id: channelId, organizationId: resolveTenant(tenantId) } });
    if (!channel) {
      throw new HttpError(404, 'Channel not found');
    }
    return channel;
  }

  private async requireMessage(tenantId: string, messageId: string) {
    const message = await prisma.commsMessage.findFirst({
      where: { id: messageId, channel: { organizationId: resolveTenant(tenantId) } },
    });
    if (!message) {
      throw new HttpError(404, 'Message not found');
    }
    return message;
  }
}

export const commsService = new CommsService();
