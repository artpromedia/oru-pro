type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export type PresenceRecord = {
  userId: string;
  userName: string;
  avatar?: string | null;
  status: PresenceStatus;
  lastActive: string;
  channels: Set<string>;
  sockets: Set<string>;
};

const now = () => new Date().toISOString();

class PresenceService {
  private tenants = new Map<string, Map<string, PresenceRecord>>();

  userConnected(tenantId: string, userId: string, userName: string, avatar: string | null | undefined, socketId: string) {
    const tenantMap = this.getTenantMap(tenantId);
    const existing = tenantMap.get(userId);
    if (existing) {
      existing.sockets.add(socketId);
      existing.status = 'online';
      existing.lastActive = now();
      tenantMap.set(userId, existing);
      return existing;
    }

    const record: PresenceRecord = {
      userId,
      userName,
      avatar: avatar ?? undefined,
      status: 'online',
      lastActive: now(),
      channels: new Set<string>(),
      sockets: new Set<string>([socketId]),
    };
    tenantMap.set(userId, record);
    return record;
  }

  userDisconnected(tenantId: string, userId: string, socketId: string) {
    const tenantMap = this.getTenantMap(tenantId);
    const existing = tenantMap.get(userId);
    if (!existing) return;
    existing.sockets.delete(socketId);
    if (existing.sockets.size === 0) {
      existing.status = 'offline';
      existing.lastActive = now();
    }
    tenantMap.set(userId, existing);
  }

  markChannel(tenantId: string, userId: string, channelId: string, action: 'join' | 'leave') {
    const tenantMap = this.getTenantMap(tenantId);
    const existing = tenantMap.get(userId);
    if (!existing) return;
    if (action === 'join') {
      existing.channels.add(channelId);
    } else {
      existing.channels.delete(channelId);
    }
    tenantMap.set(userId, existing);
  }

  setStatus(tenantId: string, userId: string, status: PresenceStatus) {
    const tenantMap = this.getTenantMap(tenantId);
    const existing = tenantMap.get(userId);
    if (!existing) return;
    existing.status = status;
    existing.lastActive = now();
    tenantMap.set(userId, existing);
  }

  list(tenantId: string) {
    return Array.from(this.getTenantMap(tenantId).values()).map((record) => ({
      userId: record.userId,
      userName: record.userName,
      avatar: record.avatar,
      status: record.status,
      lastActive: record.lastActive,
      channels: Array.from(record.channels),
    }));
  }

  private getTenantMap(tenantId: string) {
    if (!this.tenants.has(tenantId)) {
      this.tenants.set(tenantId, new Map());
    }
    return this.tenants.get(tenantId)!;
  }
}

export const presenceService = new PresenceService();
