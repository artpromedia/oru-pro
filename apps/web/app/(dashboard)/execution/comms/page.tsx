"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Hash,
  Link2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Video,
} from "lucide-react";

type Channel = {
  id: string;
  name: string;
  unread?: number;
  active?: number;
  priority?: boolean;
};

type DirectMessage = {
  id: string;
  name: string;
  status: "online" | "away" | "offline";
  unread?: number;
};

type Channels = {
  operations: Channel[];
  projects: Channel[];
  direct: DirectMessage[];
};

type Message = {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  type?: "bot" | "alert" | "system";
  linkedEntity?: { type: string; id: string };
  reactions?: string[];
  mentions?: string[];
  decision?: {
    id: string;
    status: "pending" | "approved" | "rejected";
    options: string[];
  };
  thread?: boolean;
  threadCount?: number;
};

type LinkedContextCardProps = {
  type: string;
  title: string;
  content: string;
  status: "warning" | "pending" | "info";
};

const channels: Channels = {
  operations: [
    { id: "operations-main", name: "operations-main", unread: 0, active: 23 },
    { id: "warehouse-team", name: "warehouse-team", unread: 3, active: 12 },
    { id: "qa-alerts", name: "qa-alerts", unread: 7, active: 5, priority: true },
    { id: "logistics", name: "logistics", unread: 0, active: 8 },
  ],
  projects: [
    { id: "product-launch", name: "product-launch", unread: 2, active: 15 },
    { id: "system-upgrade", name: "system-upgrade", unread: 0, active: 6 },
    { id: "compliance-2025", name: "compliance-2025", unread: 1, active: 4 },
  ],
  direct: [
    { id: "john-doe", name: "John Doe", status: "online", unread: 1 },
    { id: "sarah-smith", name: "Sarah Smith", status: "away", unread: 0 },
    { id: "mike-wilson", name: "Mike Wilson", status: "offline", unread: 0 },
  ],
};

const messages: Message[] = [
  {
    id: 1,
    author: "QA Bot",
    avatar: "🤖",
    time: "10:23 AM",
    content: "Batch B2025-1115 has passed all quality tests and is ready for release.",
    type: "bot",
    linkedEntity: { type: "batch", id: "B2025-1115" },
    reactions: ["✅", "👍"],
  },
  {
    id: 2,
    author: "Sarah Chen",
    avatar: "SC",
    time: "10:25 AM",
    content: "Great! Approving the release now. @warehouse-team please prepare for shipment.",
    mentions: ["warehouse-team"],
  },
  {
    id: 3,
    author: "Inventory Agent",
    avatar: "📦",
    time: "10:28 AM",
    content: "Alert: Low stock detected for SKU-2847. Current level: 18%. Recommended action: Create PO.",
    type: "alert",
    linkedEntity: { type: "inventory", id: "SKU-2847" },
    decision: {
      id: "DEC-2025-004",
      status: "pending",
      options: ["Create PO Now", "Wait for EOD", "Transfer from Store"],
    },
  },
  {
    id: 4,
    author: "Mike Johnson",
    avatar: "MJ",
    time: "10:30 AM",
    content: "I can transfer 200 units from the downtown location. Will that work?",
    thread: true,
    threadCount: 3,
  },
  {
    id: 5,
    author: "System",
    avatar: "🔔",
    time: "10:32 AM",
    content: "Decision DEC-2025-003 has been approved and executed. PO-11251 created.",
    type: "system",
    linkedEntity: { type: "decision", id: "DEC-2025-003" },
  },
];

const linkedContextCards: LinkedContextCardProps[] = [
  { type: "inventory", title: "SKU-2847 Status", content: "Current Stock: 18%", status: "warning" },
  { type: "decision", title: "DEC-2025-004", content: "Pending procurement decision", status: "pending" },
  { type: "project", title: "Product Launch", content: "3 tasks due today", status: "info" },
];

export default function CommunicationsHub() {
  const [activeChannel, setActiveChannel] = useState<string>("operations-main");
  const [messageDraft, setMessageDraft] = useState("");

  const activeMeta = useMemo(() => {
    const allChannels = [...channels.operations, ...channels.projects];
    const conversation = allChannels.find((c) => c.id === activeChannel);
    const dm = channels.direct.find((c) => c.id === activeChannel);
    return {
      name: conversation?.name ?? dm?.name ?? activeChannel,
      participants: conversation?.active ?? (dm ? 1 : 0),
      type: dm ? "dm" : "channel",
    } as { name: string; participants: number; type: "dm" | "channel" };
  }, [activeChannel]);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Prompt 2 · Execution</p>
          <h2 className="text-base font-semibold text-gray-900">Oonru Communications</h2>
          <p className="text-xs text-gray-500">Connected to Operations</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <ChannelSection title="Operations" channels={channels.operations} activeId={activeChannel} onSelect={setActiveChannel} />
          <ChannelSection title="Projects" channels={channels.projects} activeId={activeChannel} onSelect={setActiveChannel} />
          <DirectMessageSection title="Direct Messages" users={channels.direct} activeId={activeChannel} onSelect={setActiveChannel} />
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-gray-400" />
              <div>
                <h1 className="text-base font-semibold text-gray-900">{activeMeta.name}</h1>
                {activeMeta.type === "channel" && (
                  <p className="text-xs text-gray-500">{activeMeta.participants} active participants</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[Phone, Video, Search, MoreVertical].map((Icon) => (
                <button key={Icon.displayName ?? Icon.name} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        </section>

        <footer className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-end gap-2">
            <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              placeholder={activeMeta.type === "dm" ? `Message ${activeMeta.name}` : `Message #${activeMeta.name}`}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </footer>
      </main>

      <aside className="w-80 border-l border-gray-200 bg-white p-4">
        <h3 className="text-base font-semibold text-gray-900">Linked Context</h3>
        <div className="mt-4 space-y-3">
          {linkedContextCards.map((card) => (
            <LinkedContextCard key={card.title} {...card} />
          ))}
        </div>
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900">Active Team Members</h4>
          <div className="mt-3 space-y-2">
            <TeamMember name="Sarah Chen" role="QA Manager" status="online" />
            <TeamMember name="Mike Johnson" role="Warehouse Lead" status="online" />
            <TeamMember name="Lisa Park" role="Procurement" status="away" />
          </div>
        </div>
      </aside>
    </div>
  );
}

type ChannelSectionProps = {
  title: string;
  channels: Channel[];
  activeId: string;
  onSelect: (id: string) => void;
};

function ChannelSection({ title, channels, activeId, onSelect }: ChannelSectionProps) {
  return (
    <div className="pb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
      <div className="space-y-1">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelect(channel.id)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
              activeId === channel.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              #{channel.name}
              {channel.priority && <span className="text-xs font-semibold text-rose-600">PRIORITY</span>}
            </span>
            {channel.unread ? (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                {channel.unread}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

type DirectMessageSectionProps = {
  title: string;
  users: DirectMessage[];
  activeId: string;
  onSelect: (id: string) => void;
};

function DirectMessageSection({ title, users, activeId, onSelect }: DirectMessageSectionProps) {
  const statusColors: Record<DirectMessage["status"], string> = {
    online: "bg-emerald-500",
    away: "bg-amber-400",
    offline: "bg-gray-400",
  };

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
      <div className="space-y-1">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelect(user.id)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
              activeId === user.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold">
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
                <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${statusColors[user.status]}`} />
              </span>
              {user.name}
            </span>
            {user.unread ? (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {user.unread}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

type MessageBubbleProps = {
  message: Message;
};

function MessageBubble({ message }: MessageBubbleProps) {
  const typeStyles: Record<string, string> = {
    bot: "border-blue-200 bg-blue-50",
    alert: "border-amber-200 bg-amber-50",
    system: "border-gray-200 bg-gray-50",
    default: "border-gray-200 bg-white",
  };

  const bubbleClass = message.type ? typeStyles[message.type] ?? typeStyles.default : typeStyles.default;

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
        {message.avatar}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">{message.author}</span>
          <span className="text-xs text-gray-500">{message.time}</span>
        </div>
        <div className={`rounded-lg border p-3 ${bubbleClass}`}>
          <p className="text-sm text-gray-900">{message.content}</p>
          {message.linkedEntity && (
            <div className="mt-2 rounded border border-gray-200 bg-white p-2 text-xs text-indigo-600">
              <Link2 className="mr-1 inline h-3 w-3 text-gray-400" />
              View {message.linkedEntity.type}: {message.linkedEntity.id}
            </div>
          )}
          {message.decision && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Decision Required
              </div>
              <div className="flex flex-wrap gap-2">
                {message.decision.options.map((option) => (
                  <button key={option} className="rounded border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {message.thread && message.threadCount ? (
          <button className="mt-1 text-xs font-semibold text-indigo-600">
            View thread ({message.threadCount}) →
          </button>
        ) : null}
        {message.reactions && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            {message.reactions.map((reaction) => (
              <span key={reaction} className="rounded-full bg-white px-2 py-0.5">
                {reaction}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LinkedContextCard({ type, title, content, status }: LinkedContextCardProps) {
  const statusStyles: Record<LinkedContextCardProps["status"], string> = {
    warning: "bg-amber-50 text-amber-700",
    pending: "bg-indigo-50 text-indigo-700",
    info: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{type}</p>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500">{content}</p>
      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}>
        {status}
      </span>
    </div>
  );
}

type TeamMemberProps = {
  name: string;
  role: string;
  status: DirectMessage["status"];
};

function TeamMember({ name, role, status }: TeamMemberProps) {
  const statusText: Record<DirectMessage["status"], string> = {
    online: "text-emerald-600",
    away: "text-amber-500",
    offline: "text-gray-500",
  };
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
      <span className={`text-xs font-semibold capitalize ${statusText[status]}`}>{status}</span>
    </div>
  );
}
