import { apiFetch } from "./api";
import type { Attachment, ChannelSummary, CommsMessage, PresenceRecord } from "./comms-types";

const normalizeMessage = (message: CommsMessage): CommsMessage => ({
  ...message,
  attachments: (message.attachments as Attachment[] | null | undefined) ?? null,
  metadata: message.metadata ?? null,
});

export const fetchCommsChannels = async (): Promise<ChannelSummary[]> => {
  const response = await apiFetch<{ channels: ChannelSummary[] }>("/api/comms/channels");
  return response.channels.map((channel): ChannelSummary => ({
    ...channel,
    lastMessage: channel.lastMessage ? normalizeMessage(channel.lastMessage) : undefined,
  }));
};

export const fetchCommsMessages = async (channelId: string): Promise<CommsMessage[]> => {
  const response = await apiFetch<{ messages: CommsMessage[] }>(`/api/comms/channels/${channelId}/messages`);
  return response.messages.map(normalizeMessage);
};

export const postCommsMessage = async (
  channelId: string,
  payload: { content: string; attachments?: Attachment[] | null; metadata?: Record<string, unknown> | null; threadParentId?: string | null },
): Promise<CommsMessage> => {
  const response = await apiFetch<{ message: CommsMessage }>(`/api/comms/channels/${channelId}/messages`, {
    method: "POST",
    body: payload,
  });
  return normalizeMessage(response.message);
};

export const updateCommsMessage = async (
  messageId: string,
  payload: { content: string; attachments?: Attachment[] | null; metadata?: Record<string, unknown> | null },
): Promise<CommsMessage> => {
  const response = await apiFetch<{ message: CommsMessage }>(`/api/comms/messages/${messageId}`, {
    method: "PATCH",
    body: payload,
  });
  return normalizeMessage(response.message);
};

export const deleteCommsMessage = async (messageId: string) =>
  apiFetch<{ id: string; channelId: string }>(`/api/comms/messages/${messageId}`, { method: "DELETE" });

export const toggleCommsReaction = async (messageId: string, emoji: string): Promise<CommsMessage> => {
  const response = await apiFetch<{ message: CommsMessage }>(`/api/comms/messages/${messageId}/reactions`, {
    method: "POST",
    body: { emoji },
  });
  return normalizeMessage(response.message);
};

export const pinCommsMessage = async (messageId: string, isPinned: boolean): Promise<CommsMessage> => {
  const response = await apiFetch<{ message: CommsMessage }>(`/api/comms/messages/${messageId}/pin`, {
    method: "POST",
    body: { isPinned },
  });
  return normalizeMessage(response.message);
};

export const fetchPresence = async (): Promise<PresenceRecord[]> => {
  const response = await apiFetch<{ presence: PresenceRecord[] }>("/api/comms/presence");
  return response.presence;
};
