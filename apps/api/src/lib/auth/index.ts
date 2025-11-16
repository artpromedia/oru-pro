import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@oru/database";
import { redis } from "../redis.js";
import { env } from "../../env.js";

const SUPER_ADMIN_EMAIL = "artpromedia@oonru.ai";
const SUPER_ADMIN_ID = "OONRU-SA-001";

interface RolePermissionRecord {
  resource: string;
  action: string;
}

interface RoleRecord {
  id: string;
  name?: string | null;
  permissions: RolePermissionRecord[];
}

interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  passwordHash?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
  mfaEnabled?: boolean | null;
  mfaSecret?: string | null;
  role?: RoleRecord | null;
}

interface PrismaUserDelegate {
  findUnique: (args: unknown) => Promise<UserRecord | null>;
  update: (args: unknown) => Promise<UserRecord>;
}

interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
}

type AuthenticatedRequest = Request & { authUser?: TokenPayload };

class AuthService {
  private readonly jwtSecret = env.JWT_SECRET;
  private readonly refreshSecret = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET;
  private readonly accessExpiry = "15m";
  private readonly refreshExpiry = "7d";
  private readonly sessionTtl = 8 * 60 * 60;

  private get userDelegate(): PrismaUserDelegate {
    const extended = prisma as typeof prisma & { user?: PrismaUserDelegate };
    if (!extended.user) {
      throw new Error("User delegate not configured on Prisma client");
    }
    return extended.user;
  }

  private async safeUserUpdate(args: unknown) {
    try {
      await this.userDelegate.update(args);
    } catch (error) {
      console.warn("User update skipped", error);
    }
  }

  async login(email: string, password: string, tenantId?: string) {
    if (email === SUPER_ADMIN_EMAIL) {
      return this.handleSuperAdminLogin(email, password);
    }

    if (!tenantId) {
      throw new Error("Tenant ID required for regular users");
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error("Invalid tenant or tenant not active");
    }

    const user = await this.userDelegate.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email
        }
      },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!user) {
      await this.logFailedAttempt(email, tenantId);
      throw new Error("Invalid credentials");
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      throw new Error("Account inactive");
    }

  const validPassword = await bcrypt.compare(password, user.passwordHash ?? "");
    if (!validPassword) {
      await this.logFailedAttempt(email, tenantId);
      throw new Error("Invalid credentials");
    }

    if (user.mfaEnabled) {
      const mfaToken = jwt.sign(
        { userId: user.id, tenantId, requiresMFA: true },
        this.jwtSecret,
        { expiresIn: "5m" }
      );
      return { requiresMFA: true, mfaToken, userId: user.id };
    }

    return this.generateAuthTokens(user);
  }

  private async handleSuperAdminLogin(email: string, password: string) {
    if (!env.SUPER_ADMIN_PASSWORD_HASH) {
      throw new Error("Super admin not configured");
    }
    const validPassword = await bcrypt.compare(password, env.SUPER_ADMIN_PASSWORD_HASH);
    if (!validPassword) {
      throw new Error("Invalid super admin credentials");
    }

    const superAdminUser = {
      id: SUPER_ADMIN_ID,
      tenantId: "PLATFORM",
      email,
      firstName: "Super",
      lastName: "Admin",
      role: {
        id: "super-admin",
        name: "Super Admin",
        permissions: [{ resource: "*", action: "*" }]
      }
    };

    return this.generateAuthTokens(superAdminUser);
  }

  async verifyMFA(userId: string, token: string, mfaCode: string) {
    jwt.verify(token, this.jwtSecret);
    const user = await this.userDelegate.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: { permissions: true }
        }
      }
    });

    if (!user || !user.mfaSecret) {
      throw new Error("MFA not configured");
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: mfaCode,
      window: 2
    });

    if (!verified) {
      await this.logFailedMFA(userId);
      throw new Error("Invalid MFA code");
    }

    return this.generateAuthTokens(user);
  }

  private async generateAuthTokens(user: UserRecord) {
    const sessionId = crypto.randomBytes(32).toString("hex");
    const permissions = (user.role?.permissions ?? []).map((permission) => `${permission.resource}.${permission.action}`);

    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role?.name ?? "user",
      permissions,
      sessionId
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: this.accessExpiry });
    const refreshToken = jwt.sign({ userId: user.id, sessionId }, this.refreshSecret, {
      expiresIn: this.refreshExpiry
    });

    await redis.setex(
      `session:${sessionId}`,
      this.sessionTtl,
      JSON.stringify({
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role?.name ?? "user",
        permissions,
        createdAt: new Date().toISOString()
      })
    );

    await redis.setex(`refresh:${user.id}:${sessionId}`, 7 * 24 * 60 * 60, refreshToken);

    if (user.id !== SUPER_ADMIN_ID) {
      await this.safeUserUpdate({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    }

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "LOGIN",
        entity: "Session",
        entityId: sessionId,
        details: {
          ipAddress: "0.0.0.0",
          permissions,
          event: "login"
        }
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name ?? "user",
        permissions
      }
    };
  }

  async refreshToken(refreshToken: string) {
    const decoded = jwt.verify(refreshToken, this.refreshSecret) as Pick<TokenPayload, "userId"> & {
      sessionId: string;
    };
    const storedToken = await redis.get(`refresh:${decoded.userId}:${decoded.sessionId}`);
    if (storedToken !== refreshToken) {
      throw new Error("Invalid refresh token");
    }

    const sessionData = await redis.get(`session:${decoded.sessionId}`);
    if (!sessionData) {
      throw new Error("Session expired");
    }

    const session = JSON.parse(sessionData);
    const newAccessToken = jwt.sign(
      {
        userId: session.userId,
        tenantId: session.tenantId,
        email: session.email,
        role: session.role,
        permissions: session.permissions,
        sessionId: decoded.sessionId
      },
      this.jwtSecret,
      { expiresIn: this.accessExpiry }
    );

    await redis.expire(`session:${decoded.sessionId}`, this.sessionTtl);
    return { accessToken: newAccessToken };
  }

  async logout(sessionId: string, userId: string, tenantId = "PLATFORM") {
    await redis.del(`session:${sessionId}`);
    await redis.del(`refresh:${userId}:${sessionId}`);

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "LOGOUT",
        entity: "Session",
        entityId: sessionId,
        details: {
          ipAddress: "0.0.0.0",
          event: "logout"
        }
      }
    });
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      const session = await redis.get(`session:${decoded.sessionId}`);
      if (!session) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  async setupMFA(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `Oru Platform (${userId})`,
      issuer: "Oru Platform"
    });

    await redis.setex(`mfa:setup:${userId}`, 600, secret.base32);
    return { secret: secret.base32, qrCode: secret.otpauth_url };
  }

  async confirmMFA(userId: string, code: string) {
    const tempSecret = await redis.get(`mfa:setup:${userId}`);
    if (!tempSecret) {
      throw new Error("MFA setup expired");
    }

    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: "base32",
      token: code,
      window: 2
    });

    if (!verified) {
      throw new Error("Invalid MFA code");
    }

    await this.userDelegate.update({
      where: { id: userId },
      data: { mfaSecret: tempSecret, mfaEnabled: true }
    });

    await redis.del(`mfa:setup:${userId}`);
    return { success: true };
  }

  private async logFailedAttempt(email: string, tenantId: string) {
    const key = `failed:${tenantId}:${email}`;
    const attempts = await redis.incr(key);
    await redis.expire(key, 900);

    if (attempts >= 5) {
      await this.safeUserUpdate({
        where: {
          tenantId_email: {
            tenantId,
            email
          }
        },
        data: { status: "LOCKED" }
      });
    }
  }

  private async logFailedMFA(userId: string) {
    const key = `mfa:failed:${userId}`;
    const attempts = await redis.incr(key);
    await redis.expire(key, 300);

    if (attempts >= 3) {
      console.error(`Multiple MFA failures for user ${userId}`);
    }
  }
}

export const authService = new AuthService();

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No authorization token" });
    }

    const decoded = await authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

  (req as AuthenticatedRequest).authUser = decoded;
    next();
  } catch (error) {
    console.error("Authentication middleware error", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

export function authorize(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).authUser;
    if (!user) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    if (!user.permissions.includes(permission) && !user.permissions.includes("*.*")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
