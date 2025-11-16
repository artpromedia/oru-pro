import { PrismaClient } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Redis from "ioredis";

const DEFAULT_REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export type Cacheable = string | number | boolean | Record<string, unknown> | Array<unknown>;

class TenantDatabaseManager {
  private connections = new Map<string, PrismaClient>();
  private supabaseClient: SupabaseClient | null = null;
  public readonly redis: Redis;

  constructor() {
    this.redis = new Redis(DEFAULT_REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      retryStrategy: (times) => Math.min(times * 100, 2_000),
    });

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
  }

  async getTenantConnection(tenantId: string): Promise<PrismaClient> {
    if (!tenantId) {
      throw new Error("Tenant ID required for database access");
    }

    if (this.connections.has(tenantId)) {
      return this.connections.get(tenantId)!;
    }

    const url = this.getTenantDatabaseUrl(tenantId);
    const client = new PrismaClient({
      datasources: { db: { url } },
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error", "warn"],
    });

    this.connections.set(tenantId, client);
    return client;
  }

  async disconnectAll() {
    await Promise.all(
      Array.from(this.connections.values()).map(async (client) => {
        await client.$disconnect().catch(() => null);
      }),
    );
    this.connections.clear();
  }

  private getTenantDatabaseUrl(tenantId: string) {
    const baseUrl = process.env.DATABASE_URL; 
    if (!baseUrl) {
      throw new Error("DATABASE_URL must be configured");
    }

    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}schema=${tenantId}`;
  }

  async cacheSet<T extends Cacheable>(key: string, value: T, ttlSeconds = 3600) {
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async cacheGet<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async cacheDeletePattern(pattern: string) {
    const stream = this.redis.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];
    return new Promise<void>((resolve, reject) => {
      stream.on("data", (resultKeys: string[]) => {
        if (resultKeys.length) {
          keys.push(...resultKeys);
        }
      });

      stream.on("end", async () => {
        if (keys.length) {
          await this.redis.del(...keys);
        }
        resolve();
      });

      stream.on("error", (err) => reject(err));
    });
  }

  async publishUpdate(channel: string, data: Cacheable) {
    await this.redis.publish(channel, JSON.stringify(data));
  }

  getSupabaseClient() {
    return this.supabaseClient;
  }
}

export const dbManager = new TenantDatabaseManager();
