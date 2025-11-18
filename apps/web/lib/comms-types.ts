export type ChannelType = "channel" | "direct" | "group" | "thread";

export type ChannelSummary = {
  id: string;
  name: string;
  slug: string;
  type: ChannelType;
  isPrivate: boolean;
  topic?: string | null;
  members: number;
  unreadCount: number;
  lastMessage?: CommsMessage;
  isPinned: boolean;
  isMuted: boolean;
};

export type Attachment = {
  id: string;
  type: "image" | "file" | "video" | "audio";
  name: string;
  url: string;
  size: number;
  thumbnail?: string;
};

export type ReactionGroup = {
  emoji: string;
  users: Array<{ id: string; name: string }>;
};

export type EmbeddedBlock =
  | { type: "task"; data: Record<string, unknown> }
  | { type: "decision"; data: { title: string; savings?: string; confidence?: number } }
  | { type: "inventory"; data: { message: string } }
  | { type: "order"; data: Record<string, unknown> };

export type CodeBlock = {
  language: string;
  code: string;
};

export type CommsMessage = {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  attachments?: Attachment[] | null;
  metadata?: Record<string, unknown> | null;
  isPinned: boolean;
  isRead: boolean;
  threadParentId?: string | null;
  threadCount: number;
  reactions: ReactionGroup[];
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PresenceRecord = {
  userId: string;
  userName: string;
  avatar?: string | null;
  status: "online" | "away" | "busy" | "offline";
  lastActive: string;
  channels: string[];
};

export type CallInvite = {
  channelId: string;
  type: "audio" | "video";
  from: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  startedAt: string;
};

export type PresenceSnapshot = {
  presence: PresenceRecord[];
};
