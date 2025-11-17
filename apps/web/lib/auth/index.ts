import type { PrismaClient } from "@prisma/client";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { v4 as uuidv4 } from "uuid";

import { dbManager } from "../database";

export type SessionProfile = {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export type Session = {
  userId: string;
  tenantId: string;
  userType: "super-admin" | "tenant-admin" | "user";
  permissions: string[];
  profile: SessionProfile;
  sessionId: string;
  expiresAt: Date;
  mfaVerified: boolean;
};

export type LoginResult = {
  sessionId: string;
  expiresAt: Date;
  requiresMfa: boolean;
};

type RequestLike = Pick<NextRequest, "headers">;

const SUPER_ADMIN_EMAIL = "artpromedia@oonru.ai";
const SUPER_ADMIN_ID = "OONRU-SA-001";
const DEV_SUPER_ADMIN_PASSWORD_HASH = "$2a$10$9OmXW/byLlTj1ZNF4RJajuHU37D8GAroVE0cXdrPQgQjJfXI0qZvW";
const DEV_SUPER_ADMIN_MFA_SECRET = "JBYUQRS6IFJCGQKXFJHDELTUNVUUWN3U";

const resolveSuperAdminPasswordHash = () => {
  if (process.env.SUPER_ADMIN_PASSWORD_HASH) {
    return process.env.SUPER_ADMIN_PASSWORD_HASH;
  }
  if (process.env.NODE_ENV !== "production") {
    return DEV_SUPER_ADMIN_PASSWORD_HASH;
  }
  return undefined;
};

const resolveSuperAdminMfaSecret = () => {
  if (process.env.SUPER_ADMIN_MFA_SECRET) {
    return process.env.SUPER_ADMIN_MFA_SECRET;
  }
  if (process.env.NODE_ENV !== "production") {
    return DEV_SUPER_ADMIN_MFA_SECRET;
  }
  return undefined;
};

type TenantClient = PrismaClient & {
  user: {
    findUnique: (args: unknown) => Promise<
      | (SessionProfile & {
          id: string;
          passwordHash?: string | null;
          status?: string | null;
          role?: {
            type?: string | null;
            permissions: Array<{ name: string }>;
          } | null;
          mfaSecret?: string | null;
        })
      | null
    >;
  };
};

class AuthenticationManager {
  private sessions = new Map<string, Session>();

  async login(email: string, password: string, tenantId?: string): Promise<LoginResult> {
    if (email === SUPER_ADMIN_EMAIL) {
      const ok = await this.authenticateSuperAdmin(email, password);
      if (ok) {
        const sessionId = this.createSession({
          userId: SUPER_ADMIN_ID,
          tenantId: "PLATFORM",
          userType: "super-admin",
          permissions: ["*"],
          profile: {
            email,
            name: "Oru Platform Control",
          },
          mfaVerified: false,
        });
        const session = this.sessions.get(sessionId)!;
        return { sessionId, expiresAt: session.expiresAt, requiresMfa: !session.mfaVerified };
      }
    }

    if (!tenantId) {
      throw new Error("Tenant ID required");
    }

    const db = (await dbManager.getTenantConnection(tenantId)) as TenantClient;
    const user = await db.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    });

    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new Error("Invalid credentials");
    }

    if (user.status !== "active") {
      throw new Error("Account inactive");
    }

    const sessionId = this.createSession({
      userId: user.id,
      tenantId,
      userType: (user.role?.type as Session["userType"]) || "user",
      permissions: user.role?.permissions.map((p: { name: string }) => p.name) ?? [],
      profile: {
        email: user.email,
        name: this.buildDisplayName(user as { fullName?: string | null; firstName?: string | null; lastName?: string | null; email: string }),
      },
      mfaVerified: !user.mfaSecret,
    });

    const session = this.sessions.get(sessionId)!;
    return { sessionId, expiresAt: session.expiresAt, requiresMfa: !session.mfaVerified };
  }

  async verifyMFA(sessionId: string, token: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Invalid session");
    }

    if (session.userType === "super-admin") {
      const superSecret = resolveSuperAdminMfaSecret();
      if (!superSecret) {
        throw new Error("Super admin MFA secret missing");
      }

      const verified = speakeasy.totp.verify({
        secret: superSecret,
        encoding: "base32",
        token,
        window: 2,
      });

      if (!verified) {
        throw new Error("Invalid MFA token");
      }

      session.mfaVerified = true;
      this.sessions.set(sessionId, session);
      const issued = this.issueToken(sessionId);
      await this.logAuthEvent(session, "login_success");
      return issued;
    }

    const db = (await dbManager.getTenantConnection(session.tenantId)) as TenantClient;
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user?.mfaSecret) {
      throw new Error("MFA not configured");
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!verified) {
      throw new Error("Invalid MFA token");
    }

    session.mfaVerified = true;
    this.sessions.set(sessionId, session);
    const issued = this.issueToken(sessionId);
    await this.logAuthEvent(session, "login_success");

    return issued;
  }

  async validateRequest(req: RequestLike) {
    const rawHeader = req.headers.get("authorization");
    if (!rawHeader) {
      throw new Error("No authorization token");
    }

    const token = rawHeader.replace("Bearer ", "");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as Session & { iat: number; exp: number };
      const session = this.sessions.get(decoded.sessionId);
      if (!session) {
        throw new Error("Session expired");
      }

      if (session.expiresAt < new Date()) {
        this.sessions.delete(decoded.sessionId);
        throw new Error("Session expired");
      }

      if (!session.mfaVerified) {
        throw new Error("MFA verification required");
      }

      session.expiresAt = this.extendExpiration();
      this.sessions.set(decoded.sessionId, session);
      return session;
    } catch (error) {
      throw new Error(`Invalid token: ${(error as Error).message}`);
    }
  }

  private async authenticateSuperAdmin(email: string, password: string) {
    const storedHash = resolveSuperAdminPasswordHash();
    if (!storedHash) {
      return false;
    }

    if (email !== SUPER_ADMIN_EMAIL) {
      return false;
    }

    return bcrypt.compare(password, storedHash);
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId) ?? null;
  }

  issueToken(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session expired");
    }

    const jwtToken = this.generateJWT(session);
    return { jwt: jwtToken, session };
  }

  async logout(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      await this.logAuthEvent(session, "logout");
    }
  }

  private createSession(data: Omit<Session, "sessionId" | "expiresAt">) {
    const sessionId = uuidv4();
    const expiresAt = this.extendExpiration();

    const session: Session = { ...data, sessionId, expiresAt };
    this.sessions.set(sessionId, session);

    return sessionId;
  }

  private buildDisplayName(user: { fullName?: string | null; firstName?: string | null; lastName?: string | null; email: string }) {
    if (user.fullName) {
      return user.fullName;
    }

    const derived = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return derived || user.email;
  }

  private extendExpiration() {
    const expires = new Date();
    expires.setHours(expires.getHours() + 8);
    return expires;
  }

  private generateJWT(session: Session) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET must be configured");
    }

    return jwt.sign(
      {
        userId: session.userId,
        tenantId: session.tenantId,
        userType: session.userType,
        permissions: session.permissions,
        profile: session.profile,
        sessionId: session.sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );
  }

  private async logAuthEvent(session: Session, event: string) {
    try {
      await dbManager.redis.zadd(
        `auth:${session.tenantId}:${session.userId}`,
        Date.now(),
        JSON.stringify({ event, timestamp: new Date().toISOString(), sessionId: session.sessionId }),
      );
    } catch (error) {
      console.warn(
        `[auth] Failed to log auth event to Redis: ${(error as Error).message}`,
        { event, tenantId: session.tenantId, userId: session.userId },
      );
    }
  }
}
declare global {
  // eslint-disable-next-line no-var
  var __authManager: AuthenticationManager | undefined;
}

const authManagerInstance = globalThis.__authManager ?? new AuthenticationManager();

if (process.env.NODE_ENV !== "production") {
  globalThis.__authManager = authManagerInstance;
}

export const authManager = authManagerInstance;

export async function authMiddleware(req: NextRequest) {
  return authManager.validateRequest(req);
}
