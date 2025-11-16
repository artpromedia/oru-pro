import { dbManager } from "../database";

export type AuditEvent = {
  tenantId: string;
  userId: string;
  action: string;
  entity: string;
  details?: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  compliance?: string[];
};

class AuditLogger {
  async log(event: AuditEvent) {
    const payload = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    const channel = `audit:${event.tenantId}`;
    await dbManager.redis.zadd(channel, Date.now(), JSON.stringify(payload));
  }
}

export const auditLogger = new AuditLogger();
