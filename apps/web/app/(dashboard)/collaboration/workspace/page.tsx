'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Hash,
  AtSign,
  Search,
  Plus,
  Video,
  Phone,
  Pin,
  Star,
  Users,
  Lock,
  Smile,
  Paperclip,
  Send,
  ChevronDown,
  Circle,
  MoreVertical,
  MessageSquare,
  Bookmark,
  FileText,
} from 'lucide-react';

type Channel = {
  id: string;
  name: string;
  type: 'public' | 'private';
  unread?: number;
  members?: number;
  locked?: boolean;
  priority?: boolean;
};

type DirectMessage = {
  id: string;
  name: string;
  status: 'active' | 'away' | 'offline';
  title: string;
  unread?: number;
  type?: 'group';
  members?: number;
};

type MessageBlock =
  | { type: 'list'; items: string[] }
  | {
      type: 'alert';
      severity: 'info' | 'warning' | 'danger';
      title: string;
      description: string;
      actions: string[];
    }
  | {
      type: 'status';
      title: string;
      fields: Array<{ label: string; value: string }>;
      color: 'success' | 'warning' | 'danger';
    };

type MessageReaction = {
  emoji: string;
  count: number;
  users: string[];
};

type MessageAttachment = {
  type: 'file';
  name: string;
  size: string;
  preview?: boolean;
};

type MessageThread = {
  count: number;
  lastReply: string;
  participants: string[];
};

type ConversationMessage = {
  id: number;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  thread?: MessageThread;
  blocks?: MessageBlock[];
  mentions?: string[];
  priority?: boolean;
  pinned?: boolean;
  isIntegration?: boolean;
};

export default function CollaborationWorkspace() {
  const [activeChannel, setActiveChannel] = useState('operations-general');
  const [message, setMessage] = useState('');
  const [showThread, setShowThread] = useState(false);

  const workspace = {
    name: 'Oonru Operations',
    plan: 'Business+',
    members: 847,
  } as const;

  const channels = {
    favorites: [
      { id: 'operations-general', name: 'operations-general', type: 'public', unread: 0, members: 234, priority: false },
      { id: 'warehouse-team', name: 'warehouse-team', type: 'public', unread: 3, members: 45 },
      { id: 'urgent-issues', name: 'urgent-issues', type: 'private', unread: 1, members: 12, priority: true },
    ],
    channels: [
      { id: 'announcements', name: 'announcements', type: 'public', locked: true, members: 847 },
      { id: 'production-floor', name: 'production-floor', type: 'public', members: 67 },
      { id: 'quality-control', name: 'quality-control', type: 'public', members: 23 },
      { id: 'it-support', name: 'it-support', type: 'public', members: 156 },
    ],
    directMessages: [
      { id: 'sarah-chen', name: 'Sarah Chen', status: 'active', title: 'Operations Director', unread: 2 },
      { id: 'mike-johnson', name: 'Mike Johnson', status: 'active', title: 'Warehouse Lead' },
      { id: 'lisa-wong', name: 'Lisa Wong', status: 'away', title: 'QA Manager' },
      { id: 'team-leads', name: 'Team Leads Group', status: 'active', title: 'Leadership', type: 'group', members: 5, unread: 7 },
    ],
  } as const satisfies {
    favorites: Channel[];
    channels: Channel[];
    directMessages: DirectMessage[];
  };

  const messages: ConversationMessage[] = [
    {
      id: 1,
      author: 'Sarah Chen',
      avatar: 'SC',
      timestamp: '9:23 AM',
      content: "Good morning team! Quick reminder about today's priorities:",
      reactions: [
        { emoji: '👍', count: 12, users: ['Mike', 'Lisa', 'John'] },
        { emoji: '✅', count: 5, users: ['Emma', 'David'] },
      ],
      thread: {
        count: 8,
        lastReply: '9:45 AM',
        participants: ['Mike Johnson', 'Lisa Wong', 'John Doe'],
      },
      blocks: [
        {
          type: 'list',
          items: [
            '• Complete cycle count in Zone A by noon',
            '• Review new receiving procedures',
            '• Prep for 2pm customer visit',
          ],
        },
      ],
    },
    {
      id: 2,
      author: 'Inventory Bot',
      avatar: '🤖',
      timestamp: '9:28 AM',
      content: 'Low Stock Alert',
      blocks: [
        {
          type: 'alert',
          severity: 'warning',
          title: 'SKU-2847 Below Reorder Point',
          description: 'Current: 187 units | Reorder: 200 units',
          actions: ['Create PO', 'View Details', 'Snooze'],
        },
      ],
    },
    {
      id: 3,
      author: 'Mike Johnson',
      avatar: 'MJ',
      timestamp: '9:35 AM',
      content: 'Just completed the morning receiving. Everything checked in smoothly.',
      attachments: [
        {
          type: 'file',
          name: 'receiving_report_111525.pdf',
          size: '234 KB',
          preview: true,
        },
      ],
      reactions: [{ emoji: '🎉', count: 3, users: ['Sarah', 'Lisa'] }],
    },
    {
      id: 4,
      author: 'QA System',
      avatar: '🔍',
      timestamp: '9:42 AM',
      content: 'Quality Check Results',
      isIntegration: true,
      blocks: [
        {
          type: 'status',
          title: 'Batch B-2025-1115 PASSED',
          fields: [
            { label: 'Temperature', value: '3.2°C ✓' },
            { label: 'pH Level', value: '4.6 ✓' },
            { label: 'Microbial', value: 'Within limits ✓' },
          ],
          color: 'success',
        },
      ],
    },
    {
      id: 5,
      author: 'Lisa Wong',
      avatar: 'LW',
      timestamp: '9:48 AM',
      content:
        '@channel Reminder: FDA auditor arriving at 2pm. Please ensure all documentation is ready and work areas are inspection-ready.',
      mentions: ['@channel'],
      priority: true,
      pinned: true,
      reactions: [{ emoji: '👀', count: 15, users: ['Everyone'] }],
    },
  ];

  return (
    <div className='h-screen flex bg-white'>
      <aside className='w-64 bg-gray-900 text-gray-300 flex flex-col'>
        <div className='p-4 border-b border-gray-800'>
          <button className='w-full flex items-center justify-between hover:bg-gray-800 rounded p-2'>
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-blue-600 rounded flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>O</span>
              </div>
              <div className='text-left'>
                <p className='text-white font-medium'>{workspace.name}</p>
                <p className='text-xs text-gray-400'>{workspace.members} members</p>
              </div>
            </div>
            <ChevronDown className='w-4 h-4' />
          </button>
        </div>

        <div className='p-3'>
          <button className='w-full flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded hover:bg-gray-700'>
            <Search className='w-4 h-4' />
            <span className='text-sm'>Search</span>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto'>
          <div className='px-3 mb-4 space-y-1'>
            <SidebarButton icon={MessageSquare} label='Threads' />
            <SidebarButton icon={AtSign} label='Mentions & reactions' badge='3' />
            <SidebarButton icon={Bookmark} label='Saved items' />
          </div>

          <SidebarSection title='Favorites'>
            {channels.favorites.map((channel) => (
              <ChannelItem key={channel.id} channel={channel} active={activeChannel === channel.id} onClick={() => setActiveChannel(channel.id)} />
            ))}
          </SidebarSection>

          <SidebarSection title='Channels'>
            {channels.channels.map((channel) => (
              <ChannelItem key={channel.id} channel={channel} active={activeChannel === channel.id} onClick={() => setActiveChannel(channel.id)} />
            ))}
          </SidebarSection>

          <SidebarSection title='Direct messages'>
            {channels.directMessages.map((dm) => (
              <DirectMessageItem key={dm.id} user={dm} onClick={() => setActiveChannel(dm.id)} />
            ))}
          </SidebarSection>
        </div>
      </aside>

      <main className='flex-1 flex flex-col'>
        <header className='h-16 border-b border-gray-200 px-6 flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <Hash className='w-5 h-5 text-gray-500' />
            <h1 className='font-semibold text-gray-900'>operations-general</h1>
            <Star className='w-4 h-4 text-gray-400 cursor-pointer hover:text-yellow-500' />
            <span className='text-sm text-gray-500'>234 members</span>
          </div>
          <div className='flex items-center space-x-2'>
            <IconButton icon={Phone} />
            <IconButton icon={Video} />
            <IconButton icon={Pin} />
            <IconButton icon={Users} />
            <IconButton icon={MoreVertical} />
          </div>
        </header>

        <section className='flex-1 overflow-y-auto px-6 py-4'>
          <div className='space-y-4'>
            {messages.map((msg) => (
              <MessageComponent key={msg.id} message={msg} onThreadClick={() => setShowThread(true)} />
            ))}
          </div>
        </section>

        <footer className='p-4 border-t border-gray-200'>
          <div className='bg-white border border-gray-300 rounded-lg'>
            <div className='p-3'>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='Message #operations-general'
                className='w-full resize-none outline-none'
                rows={1}
              />
            </div>
            <div className='flex items-center justify-between px-3 pb-3'>
              <div className='flex items-center space-x-2'>
                <IconButton icon={Plus} subtle />
                <IconButton icon={Paperclip} subtle />
                <IconButton icon={Smile} subtle />
                <IconButton icon={AtSign} subtle />
              </div>
              <button className='px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1'>
                <Send className='w-4 h-4' />
                <span>Send</span>
              </button>
            </div>
          </div>
        </footer>
      </main>

      {showThread && (
        <aside className='w-96 border-l border-gray-200 bg-white flex flex-col'>
          <div className='h-16 border-b border-gray-200 px-4 flex items-center justify-between'>
            <h2 className='font-semibold'>Thread</h2>
            <button onClick={() => setShowThread(false)} className='p-1 hover:bg-gray-100 rounded'>
              ✕
            </button>
          </div>
          <div className='p-4 text-sm text-gray-600'>Thread replies would appear here...</div>
        </aside>
      )}
    </div>
  );
}

function SidebarButton({ icon: Icon, label, badge }: { icon: LucideIcon; label: string; badge?: string }) {
  return (
    <button className='w-full flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-800 rounded'>
      <Icon className='w-4 h-4' />
      <span className='text-sm'>{label}</span>
      {badge && <span className='ml-auto text-xs bg-red-600 text-white px-1.5 rounded'>{badge}</span>}
    </button>
  );
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='mb-4'>
      <div className='px-3 py-1 flex items-center justify-between text-xs uppercase text-gray-500'>
        <span>{title}</span>
        <Plus className='w-3 h-3 text-gray-500 cursor-pointer hover:text-gray-300' />
      </div>
      {children}
    </div>
  );
}

function ChannelItem({ channel, active, onClick }: { channel: Channel; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center space-x-2 px-3 py-1 hover:bg-gray-800 ${active ? 'bg-gray-800 text-white' : ''}`}>
      {channel.type === 'private' ? <Lock className='w-3 h-3' /> : <Hash className='w-3 h-3' />}
      <span className='text-sm'>{channel.name}</span>
      {!!channel.unread && <span className='ml-auto text-xs bg-red-600 text-white px-1.5 rounded'>{channel.unread}</span>}
    </button>
  );
}

function DirectMessageItem({ user, onClick }: { user: DirectMessage; onClick: () => void }) {
  return (
    <button onClick={onClick} className='w-full flex items-center space-x-2 px-3 py-1 hover:bg-gray-800'>
      <div className='relative'>
        <div className='w-2 h-2 bg-gray-500 rounded-full' />
        {user.status === 'active' && <Circle className='w-2 h-2 text-green-500 fill-current absolute -top-0.5 -left-0.5' />}
      </div>
      <span className='text-sm'>{user.name}</span>
      {!!user.unread && <span className='ml-auto text-xs bg-red-600 text-white px-1.5 rounded'>{user.unread}</span>}
    </button>
  );
}

function MessageComponent({ message, onThreadClick }: { message: ConversationMessage; onThreadClick: () => void }) {
  return (
    <div className={`flex space-x-3 ${message.priority ? 'bg-yellow-50 -mx-6 px-6 py-3' : ''}`}>
      <div className='w-10 h-10 bg-gray-300 rounded flex items-center justify-center text-sm font-medium'>{message.avatar}</div>
      <div className='flex-1'>
        <div className='flex items-baseline space-x-2'>
          <span className='font-medium text-gray-900'>{message.author}</span>
          <span className='text-xs text-gray-500'>{message.timestamp}</span>
          {message.pinned && <Pin className='w-3 h-3 text-gray-500' />}
        </div>
        <div className='text-gray-800 whitespace-pre-line'>{message.content}</div>

        {message.blocks?.map((block, index) => (
          <div key={index} className='mt-2'>
            {block.type === 'list' && (
              <div className='text-sm text-gray-700 space-y-1'>
                {block.items.map((item, i) => (
                  <div key={i}>{item}</div>
                ))}
              </div>
            )}
            {block.type === 'alert' && (
              <div className={`p-3 rounded border ${block.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                <p className='font-medium text-sm'>{block.title}</p>
                <p className='text-sm text-gray-600 mt-1'>{block.description}</p>
                <div className='flex space-x-2 mt-2'>
                  {block.actions.map((action) => (
                    <button key={action} className='text-xs text-blue-600 hover:text-blue-700'>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {block.type === 'status' && (
              <div className='p-3 bg-green-50 border border-green-200 rounded'>
                <p className='font-medium text-sm text-green-900'>{block.title}</p>
                <div className='grid grid-cols-3 gap-2 mt-2'>
                  {block.fields.map((field) => (
                    <div key={field.label} className='text-xs'>
                      <p className='text-gray-600'>{field.label}</p>
                      <p className='font-medium'>{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

  {message.attachments && message.attachments.length > 0 && (
          <div className='mt-2'>
            {message.attachments.map((att, index) => (
              <div key={index} className='inline-flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200'>
                <FileText className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-700'>{att.name}</span>
                <span className='text-xs text-gray-500'>{att.size}</span>
              </div>
            ))}
          </div>
        )}

        <div className='flex items-center space-x-4 mt-2'>
          {message.reactions?.map((reaction) => (
            <button key={reaction.emoji} className='flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200'>
              <span>{reaction.emoji}</span>
              <span className='text-xs text-gray-600'>{reaction.count}</span>
            </button>
          ))}

          {message.thread && (
            <button onClick={onThreadClick} className='text-sm text-blue-600 hover:text-blue-700'>
              {message.thread.count} replies
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon: Icon, subtle }: { icon: LucideIcon; subtle?: boolean }) {
  return (
    <button className={`p-2 rounded ${subtle ? 'hover:bg-gray-100' : 'hover:bg-gray-100 border border-gray-200'}`}>
      <Icon className='w-4 h-4 text-gray-600' />
    </button>
  );
}
