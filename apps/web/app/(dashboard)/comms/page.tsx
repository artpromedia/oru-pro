"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  Bot,
  ChevronDown,
  Circle,
  Code,
  Download,
  Edit2,
  FileText,
  Hash,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Paperclip,
  Pin,
  Plus,
  Reply,
  Search,
  Send,
  Settings,
  Smile,
  Trash2,
  Users,
  Video,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  deleteCommsMessage,
  fetchCommsChannels,
  fetchCommsMessages,
  fetchPresence,
  pinCommsMessage,
  postCommsMessage,
  toggleCommsReaction,
  updateCommsMessage,
} from "@/lib/comms-api";
import type { Attachment, ChannelSummary, CommsMessage, PresenceRecord } from "@/lib/comms-types";

const VideoCall = dynamic(() => import("@/components/comms/VideoCall"), { ssr: false });
const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor"), { ssr: false });

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

const formatTimestamp = (iso: string) => timeFormatter.format(new Date(iso));

const sortMessages = (items: CommsMessage[]) =>
  [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

export default function CommunicationHub() {
  const { user } = useAuth();
  const { socket, connected } = useWebSocket(user);
  const queryClient = useQueryClient();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommsMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<CommsMessage | null>(null);
  const [showThreadView, setShowThreadView] = useState(false);
  const [selectedThread, setSelectedThread] = useState<CommsMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserList, setShowUserList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [presence, setPresence] = useState<PresenceRecord[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ channelId: string; from: { id: string; name: string }; type: "audio" | "video" } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedCompanyCode, setSelectedCompanyCode] = useState("CC01");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const channelsQuery = useQuery({
    queryKey: ["comms", "channels"],
    queryFn: fetchCommsChannels,
    staleTime: 30_000,
  });

  const channels = channelsQuery.data ?? [];
  const selectedChannel = useMemo<ChannelSummary | null>(() => {
    if (!channels.length) return null;
    if (selectedChannelId) {
      return channels.find((channel) => channel.id === selectedChannelId) ?? channels[0];
    }
    return channels[0];
  }, [channels, selectedChannelId]);

  useEffect(() => {
    if (!selectedChannelId && channels.length) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const messagesQuery = useQuery({
    queryKey: ["comms", "messages", selectedChannel?.id],
    queryFn: () => fetchCommsMessages(selectedChannel!.id),
    enabled: Boolean(selectedChannel?.id),
    staleTime: 5_000,
  });

  const [messages, setMessages] = useState<CommsMessage[]>([]);

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(sortMessages(messagesQuery.data));
      scrollToBottom();
    }
  }, [messagesQuery.data]);

  const presenceQuery = useQuery({
    queryKey: ["comms", "presence"],
    queryFn: fetchPresence,
    enabled: !socket,
  });

  useEffect(() => {
    if (presenceQuery.data) {
      setPresence(presenceQuery.data);
    }
  }, [presenceQuery.data]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!socket || !selectedChannel) return;
    socket.emit("channel:join", { channelId: selectedChannel.id });
    return () => {
      socket.emit("channel:leave", { channelId: selectedChannel.id });
    };
  }, [socket, selectedChannel?.id]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: CommsMessage) => {
      setMessages((prev) => sortMessages([...prev.filter((item) => item.id !== message.id), message]));
      queryClient.invalidateQueries({ queryKey: ["comms", "channels"] }).catch(() => undefined);
      scrollToBottom();
    };

    const handleUpdatedMessage = (message: CommsMessage) => {
      setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));
    };

    const handleDeletedMessage = ({ id }: { id: string }) => {
      setMessages((prev) => prev.filter((item) => item.id !== id));
    };

    const handleHistory = ({ channelId, messages: history }: { channelId: string; messages: CommsMessage[] }) => {
      if (channelId === selectedChannel?.id) {
        setMessages(sortMessages(history));
        scrollToBottom();
      }
    };

    const handleTyping = ({ channelId, userId: typingUserId, userName, isTyping: remoteTyping }: { channelId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (!selectedChannel || channelId !== selectedChannel.id || typingUserId === user?.id) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (remoteTyping) {
          next[typingUserId] = userName;
        } else {
          delete next[typingUserId];
        }
        return next;
      });
    };

    const handlePresence = (snapshot: PresenceRecord[]) => setPresence(snapshot);
    const handleIncomingCall = (payload: { channelId: string; from: { id: string; name: string }; type: "audio" | "video" }) => {
      setIncomingCall(payload);
    };
    const handleCallEnded = ({ channelId }: { channelId: string }) => {
      if (selectedChannel?.id === channelId) {
        setIsInCall(false);
        setCallType(null);
        setIncomingCall(null);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", handleUpdatedMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("channel:history", handleHistory);
    socket.on("user:typing", handleTyping);
    socket.on("comms:presence", handlePresence);
    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", handleUpdatedMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("channel:history", handleHistory);
      socket.off("user:typing", handleTyping);
      socket.off("comms:presence", handlePresence);
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:ended", handleCallEnded);
    };
  }, [socket, selectedChannel?.id, queryClient, scrollToBottom, user?.id]);

  const optimisticUpdate = useCallback(
    (message: CommsMessage) => {
      setMessages((prev) => sortMessages([...prev.filter((item) => item.id !== message.id), message]));
    },
    [],
  );

  const messageDeleteMutation = useMutation({
    mutationFn: (messageId: string) => deleteCommsMessage(messageId),
    onSuccess: (result) => {
      setMessages((prev) => prev.filter((message) => message.id !== result.id));
    },
  });

  const reactionMutation = useMutation<CommsMessage, Error, { messageId: string; emoji: string }>(
    ({ messageId, emoji }) => toggleCommsReaction(messageId, emoji),
    {
      onSuccess: optimisticUpdate,
    },
  );

  const pinMutation = useMutation<CommsMessage, Error, { messageId: string; isPinned: boolean }>(
    ({ messageId, isPinned }) => pinCommsMessage(messageId, isPinned),
    {
      onSuccess: optimisticUpdate,
    },
  );

  const { mutate: editMessage } = useMutation<CommsMessage, Error, { messageId: string; content: string }>(
    ({ messageId, content }) => updateCommsMessage(messageId, { content }),
    {
      onSuccess: (message) => {
        optimisticUpdate(message);
        setEditingMessage(null);
      },
    },
  );

  const handleSend = useCallback(() => {
    if (!messageInput.trim() || !selectedChannel || !user) return;

    if (editingMessage) {
      editMessage({ messageId: editingMessage.id, content: messageInput.trim() });
      setMessageInput("");
      setShowEmojiPicker(false);
      setReplyingTo(null);
      return;
    }

    const payload = {
      channelId: selectedChannel.id,
      content: messageInput.trim(),
      threadParentId: replyingTo?.id,
    };

    const fallback = () =>
      postCommsMessage(selectedChannel.id, payload)
        .then((response) => {
          optimisticUpdate(response);
          scrollToBottom();
        })
        .catch(() => undefined);

    if (socket?.connected) {
      socket.emit("message:send", payload, (response: { success: boolean; message?: CommsMessage }) => {
        if (!response?.success || !response.message) {
          void fallback();
          return;
        }
        optimisticUpdate(response.message);
      });
    } else {
      void fallback();
    }

    setMessageInput("");
    setShowEmojiPicker(false);
    setReplyingTo(null);
    scrollToBottom();
  }, [messageInput, selectedChannel, socket, replyingTo, user, optimisticUpdate, scrollToBottom, editingMessage, editMessage]);

  const handleTyping = () => {
    if (!socket || !selectedChannel) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("user:typing", { channelId: selectedChannel.id, isTyping: true });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("user:typing", { channelId: selectedChannel.id, isTyping: false });
    }, 1000);
  };

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    return channels.filter((channel) => channel.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [channels, searchQuery]);

  const onlineUsers = presence.filter((record) => record.status === "online");
  const typingList = Object.values(typingUsers);

  const startCall = (type: "audio" | "video") => {
    if (!selectedChannel) return;
    setCallType(type);
    setIsInCall(true);
    socket?.emit("call:start", { channelId: selectedChannel.id, type });
  };

  const handleIncomingCallAccept = () => {
    if (!incomingCall) return;
    setCallType(incomingCall.type);
    setIsInCall(true);
    setIncomingCall(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        channels={filteredChannels}
        selectedChannelId={selectedChannel?.id}
        onChannelSelect={setSelectedChannelId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onlineUsers={onlineUsers.length}
      />

      <div className="flex flex-1 flex-col">
        {selectedChannel ? (
          <>
            <Header
              channel={selectedChannel}
              onlineUsers={onlineUsers.length}
              connected={connected}
              onStartCall={startCall}
              showUserList={showUserList}
              setShowUserList={setShowUserList}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              selectedCompanyCode={selectedCompanyCode}
              setSelectedCompanyCode={setSelectedCompanyCode}
            />

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {messages.map((message) => (
                    <MessageComponent
                      key={message.id}
                      message={message}
                      onReply={() => setReplyingTo(message)}
                      onEdit={() => {
                        setEditingMessage(message);
                        setMessageInput(message.content);
                      }}
                      onDelete={() => {
                        if (socket?.connected) {
                          socket.emit("message:delete", { messageId: message.id });
                        } else {
                          messageDeleteMutation.mutate(message.id);
                        }
                      }}
                      onReact={(emoji) => {
                        if (socket?.connected) {
                          socket.emit("message:react", { messageId: message.id, emoji });
                        } else {
                          reactionMutation.mutate({ messageId: message.id, emoji });
                        }
                      }}
                      onPin={() => {
                        if (socket?.connected) {
                          socket.emit("message:pin", { messageId: message.id, isPinned: !message.isPinned });
                        } else {
                          pinMutation.mutate({ messageId: message.id, isPinned: !message.isPinned });
                        }
                      }}
                      onThreadClick={() => {
                        setSelectedThread(message);
                        setShowThreadView(true);
                      }}
                      isOwn={message.authorId === user?.id}
                    />
                  ))}
                  {typingList.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-75" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-150" />
                      </div>
                      {typingList.join(", ")} {typingList.length === 1 ? "is" : "are"} typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <Composer
                  messageInput={messageInput}
                  setMessageInput={setMessageInput}
                  showEmojiPicker={showEmojiPicker}
                  setShowEmojiPicker={setShowEmojiPicker}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  editingMessage={editingMessage}
                  setEditingMessage={setEditingMessage}
                  onSend={handleSend}
                  onTyping={handleTyping}
                  setShowCodeEditor={setShowCodeEditor}
                />
              </div>

              {showThreadView && selectedThread && (
                <ThreadPanel message={selectedThread} onClose={() => setShowThreadView(false)} />
              )}

              {showUserList && <PresencePanel presence={presence} />}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-3 h-12 w-12" />
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {isInCall && callType && selectedChannel && (
        <VideoCall
          type={callType}
          channelId={selectedChannel.name}
          onEnd={() => {
            setIsInCall(false);
            setCallType(null);
            socket?.emit("call:end", { channelId: selectedChannel.id });
          }}
        />
      )}

      {showCodeEditor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="flex h-3/4 w-3/4 flex-col rounded-lg bg-white">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="font-semibold">Insert Code</h3>
              <button onClick={() => setShowCodeEditor(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="flex-1">
              <CodeEditor
                onSave={(code, language) => {
                  setMessageInput((prev) => `${prev}\n\`\`\`${language}\n${code}\n\`\`\`\n`);
                  setShowCodeEditor(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {incomingCall && (
        <div className="fixed bottom-4 right-4 z-30 w-80 rounded-lg border border-emerald-200 bg-white p-4 shadow-xl">
          <p className="text-sm text-gray-500">Incoming {incomingCall.type} call</p>
          <p className="text-lg font-semibold text-gray-900">{incomingCall.from.name}</p>
          <div className="mt-4 flex items-center gap-2">
            <button className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white" onClick={handleIncomingCallAccept}>
              Accept
            </button>
            <button
              className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-semibold text-gray-700"
              onClick={() => setIncomingCall(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  channels,
  selectedChannelId,
  onChannelSelect,
  searchQuery,
  setSearchQuery,
  onlineUsers,
}: {
  channels: ChannelSummary[];
  selectedChannelId?: string;
  onChannelSelect: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onlineUsers: number;
}) {
  return (
    <div className="flex w-72 flex-col bg-gray-900 text-white">
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-400">Oru Platform</p>
            <p className="text-sm text-gray-400">{onlineUsers} online</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search channels or people"
            className="w-full rounded-lg bg-gray-800 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarSection
          title="Channels"
          icon={<Hash className="h-3.5 w-3.5 text-gray-400" />}
          items={channels.filter((channel) => channel.type === "channel")}
          selectedChannelId={selectedChannelId}
          onChannelSelect={onChannelSelect}
        />
        <SidebarSection
          title="Direct Messages"
          icon={<MessageSquare className="h-3.5 w-3.5 text-gray-400" />}
          items={channels.filter((channel) => channel.type === "direct")}
          selectedChannelId={selectedChannelId}
          onChannelSelect={onChannelSelect}
        />
      </div>
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-700" />
          <div>
            <p className="text-sm font-semibold">{typeof window === "undefined" ? "" : localStorage.getItem("oru:user:name") ?? "Alex Rivera"}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <Settings className="ml-auto h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  icon,
  items,
  selectedChannelId,
  onChannelSelect,
}: {
  title: string;
  icon: ReactNode;
  items: ChannelSummary[];
  selectedChannelId?: string;
  onChannelSelect: (id: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
        <span className="flex items-center gap-1">
          {icon}
          {title}
        </span>
        <Plus className="h-3 w-3 text-gray-500" />
      </div>
      <div className="space-y-1">
        {items.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
              selectedChannelId === channel.id ? "bg-emerald-600 text-white" : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            {channel.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
            <span className="flex-1 truncate">{channel.name}</span>
            {channel.unreadCount > 0 && <span className="rounded-full bg-white/20 px-2 text-xs">{channel.unreadCount}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Header({
  channel,
  onlineUsers,
  connected,
  onStartCall,
  showUserList,
  setShowUserList,
  selectedPeriod,
  setSelectedPeriod,
  selectedCompanyCode,
  setSelectedCompanyCode,
}: {
  channel: ChannelSummary;
  onlineUsers: number;
  connected: boolean;
  onStartCall: (type: "audio" | "video") => void;
  showUserList: boolean;
  setShowUserList: (value: boolean) => void;
  selectedPeriod: string;
  setSelectedPeriod: (value: string) => void;
  selectedCompanyCode: string;
  setSelectedCompanyCode: (value: string) => void;
}) {
  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <MessageSquare className="h-6 w-6 text-emerald-600" /> {channel.name}
          </h1>
          <p className="text-sm text-gray-500">{channel.topic ?? "Real-time collaboration with AI insight."}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Circle className={`h-2 w-2 ${connected ? "text-emerald-500" : "text-gray-400"}`} fill="currentColor" />
            {connected ? "Live" : "Reconnecting"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" /> {onlineUsers} online
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SelectorCard
          label="Company Code"
          value={selectedCompanyCode}
          onChange={setSelectedCompanyCode}
          options={[
            { value: "CC01", label: "US Operations" },
            { value: "CC02", label: "EU Operations" },
            { value: "CC03", label: "APAC Operations" },
          ]}
        />
        <SelectorCard
          label="Fiscal Period"
          value={selectedPeriod}
          onChange={setSelectedPeriod}
          options={[
            { value: "current", label: "Nov 2024" },
            { value: "previous", label: "Oct 2024" },
            { value: "quarter", label: "Q4 2024" },
            { value: "year", label: "FY 2024" },
          ]}
        />
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <FileText className="h-4 w-4" /> Export summary
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          onClick={() => onStartCall("video")}
        >
          <Video className="h-4 w-4" /> Video call
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          onClick={() => setShowUserList(!showUserList)}
        >
          <Users className="h-4 w-4" /> Members
        </button>
      </div>
    </div>
  );
}

function SelectorCard({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent text-sm font-semibold text-gray-900 focus:outline-none">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Composer({
  messageInput,
  setMessageInput,
  showEmojiPicker,
  setShowEmojiPicker,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  onSend,
  onTyping,
  setShowCodeEditor,
}: {
  messageInput: string;
  setMessageInput: Dispatch<SetStateAction<string>>;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (value: boolean) => void;
  replyingTo: CommsMessage | null;
  setReplyingTo: (message: CommsMessage | null) => void;
  editingMessage: CommsMessage | null;
  setEditingMessage: (message: CommsMessage | null) => void;
  onSend: () => void;
  onTyping: () => void;
  setShowCodeEditor: (value: boolean) => void;
}) {
  return (
    <div className="border-t bg-white px-6 py-4">
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-50 p-2 text-sm text-gray-600">
          <span>
            <Reply className="mr-2 inline h-4 w-4" /> Replying to {replyingTo.authorName}
          </span>
          <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
      )}
      {editingMessage && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 p-2 text-sm text-blue-700">
          <span>
            <Edit2 className="mr-2 inline h-4 w-4" /> Editing message
          </span>
          <button
            onClick={() => {
              setEditingMessage(null);
              setMessageInput("");
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Cancel
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button className="rounded-lg p-2 hover:bg-gray-100">
          <Paperclip className="h-5 w-5 text-gray-600" />
        </button>
        <div className="relative flex-1">
          <textarea
            value={messageInput}
            onChange={(event) => {
              setMessageInput(event.target.value);
              onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Type a message"
            rows={1}
            className="w-full resize-none rounded-lg bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="rounded p-1 hover:bg-gray-200">
              <Smile className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={() => setShowCodeEditor(true)} className="rounded p-1 hover:bg-gray-200">
              <Code className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <EmojiPicker
                onEmojiClick={(emojiData: EmojiClickData) => {
                  setMessageInput((prev) => `${prev}${emojiData.emoji}`);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>
        <button
          onClick={onSend}
          disabled={!messageInput.trim()}
          className="rounded-lg bg-emerald-600 p-2 text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function MessageComponent({
  message,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onThreadClick,
  isOwn,
}: {
  message: CommsMessage;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onPin: () => void;
  onThreadClick: () => void;
  isOwn: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const metadata = (message.metadata ?? {}) as {
    embedded?: { type: string; data: Record<string, unknown> };
    codeBlock?: { language: string; code: string };
  };

  const embedded = metadata.embedded;
  const codeBlock = metadata.codeBlock;

  return (
    <div
      className="group flex gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="h-9 w-9 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="font-semibold text-gray-900">{message.authorName}</span>
          <span className="text-xs text-gray-500">{formatTimestamp(message.createdAt)}</span>
          {message.editedAt && <span className="text-xs text-gray-400">(edited)</span>}
        </div>
        <div className="text-gray-700">{message.content}</div>
        {codeBlock && (
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-100">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">{codeBlock.language}</div>
            <code>{codeBlock.code}</code>
          </pre>
        )}
        {embedded && <EmbeddedContent type={embedded.type} data={embedded.data} />}
        {Array.isArray(message.attachments) && message.attachments.length > 0 && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
        {message.reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-600"
                onClick={() => onReact(reaction.emoji)}
              >
                {reaction.emoji} {reaction.users.length}
              </button>
            ))}
          </div>
        )}
        {message.threadCount > 0 && (
          <button onClick={onThreadClick} className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
            <MessageSquare className="h-4 w-4" /> {message.threadCount} replies
          </button>
        )}
      </div>
      {showActions && (
        <div className="flex items-start gap-1">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="rounded p-1 hover:bg-gray-200">
            <Smile className="h-4 w-4 text-gray-600" />
          </button>
          <button onClick={onReply} className="rounded p-1 hover:bg-gray-200">
            <Reply className="h-4 w-4 text-gray-600" />
          </button>
          {isOwn && (
            <button onClick={onEdit} className="rounded p-1 hover:bg-gray-200">
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
          )}
          <button onClick={onPin} className={`rounded p-1 hover:bg-gray-200 ${message.isPinned ? "text-amber-500" : "text-gray-600"}`}>
            <Pin className="h-4 w-4" />
          </button>
          {isOwn && (
            <button onClick={onDelete} className="rounded p-1 hover:bg-gray-200">
              <Trash2 className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      )}
      {showEmojiPicker && (
        <div className="relative">
          <EmojiPicker
            onEmojiClick={(emojiData: EmojiClickData) => {
              onReact(emojiData.emoji);
              setShowEmojiPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.type === "image") {
    return (
      <div className="relative overflow-hidden rounded-lg border">
        <img src={attachment.thumbnail ?? attachment.url} alt={attachment.name} className="h-40 w-full object-cover" />
        <button className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white">
          <Download className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
      <FileText className="h-5 w-5 text-gray-600" />
      <div>
        <p className="text-sm font-semibold text-gray-900">{attachment.name}</p>
        <p className="text-xs text-gray-500">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <button className="ml-auto rounded p-1 hover:bg-gray-100">
        <Download className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

function EmbeddedContent({ type, data }: { type: string; data: Record<string, unknown> }) {
  switch (type) {
    case "decision":
      return (
        <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
          <div className="flex items-start gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-semibold text-purple-900">{String(data.title ?? "Decision insight")}</p>
              <p className="text-sm text-purple-700">
                Savings: {String(data.savings ?? "--")} · Confidence: {String(data.confidence ?? "--")}%
              </p>
              <button className="text-sm text-purple-600">View analysis →</button>
            </div>
          </div>
        </div>
      );
    case "inventory":
      return (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Inventory Alert</p>
              <p className="text-sm text-blue-700">{String(data.message ?? "Review required")}</p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function ThreadPanel({ message, onClose }: { message: CommsMessage; onClose: () => void }) {
  return (
    <div className="w-96 border-l bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Thread</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm text-gray-700">{message.content}</p>
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Thread activity coming soon.</div>
      </div>
    </div>
  );
}

function PresencePanel({ presence }: { presence: PresenceRecord[] }) {
  return (
    <div className="w-64 border-l bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">Members</h3>
      </div>
      <div className="space-y-2 p-4">
        {presence.map((record) => (
          <div key={record.userId} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{record.userName}</p>
              <p className="text-xs text-gray-500">Last active {formatTimestamp(record.lastActive)}</p>
            </div>
            <span className={`text-xs font-semibold ${record.status === "online" ? "text-emerald-600" : "text-gray-400"}`}>
              {record.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
