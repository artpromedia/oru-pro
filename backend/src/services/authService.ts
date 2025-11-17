import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { v4 as uuid } from 'uuid';

import { prisma } from '../lib/prisma';
import { emailService } from './emailService';

const SUPER_ADMIN_EMAIL = 'artpromedia@oonru.ai';
const SUPER_ADMIN_ID = 'OONRU-SA-001';
const DEV_SUPER_ADMIN_PASSWORD_HASH = '$2a$10$9OmXW/byLlTj1ZNF4RJajuHU37D8GAroVE0cXdrPQgQjJfXI0qZvW';
const DEV_SUPER_ADMIN_MFA_SECRET = 'JBYUQRS6IFJCGQKXFJHDELTUNVUUWN3U';

const resolveSuperAdminPasswordHash = () => {
  if (process.env.SUPER_ADMIN_PASSWORD_HASH) {
    return process.env.SUPER_ADMIN_PASSWORD_HASH;
  }
  if (process.env.NODE_ENV !== 'production') {
    return DEV_SUPER_ADMIN_PASSWORD_HASH;
  }
  return undefined;
};

const resolveSuperAdminMfaSecret = () => {
  if (process.env.SUPER_ADMIN_MFA_SECRET) {
    return process.env.SUPER_ADMIN_MFA_SECRET;
  }
  if (process.env.NODE_ENV !== 'production') {
    return DEV_SUPER_ADMIN_MFA_SECRET;
  }
  return undefined;
};

export type SessionProfile = {
  email: string;
  name?: string | null;
};

export type SessionRecord = {
  sessionId: string;
  userId: string;
  organizationId: string;
  roles: string[];
  scopes: string[];
  profile: SessionProfile;
  mfaVerified: boolean;
  expiresAt: Date;
  isSuperAdmin: boolean;
};

export type LoginResult = {
  sessionId: string;
  expiresAt: Date;
  requiresMfa: boolean;
};

const parseSettings = (settings: unknown): Record<string, unknown> => {
  if (settings && typeof settings === 'object') {
    return settings as Record<string, unknown>;
  }
  return {};
};

class AuthService {
  private sessions = new Map<string, SessionRecord>();

  private get jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET must be configured');
    }
    return secret;
  }

  private get sessionHours() {
    return Number(process.env.AUTH_SESSION_HOURS ?? 8);
  }

  async login(email: string, password: string): Promise<LoginResult> {
    if (email === SUPER_ADMIN_EMAIL) {
      const ok = await this.authenticateSuperAdmin(password);
      if (!ok) {
        throw new Error('Invalid credentials');
      }
      const sessionId = this.createSession({
        userId: SUPER_ADMIN_ID,
        organizationId: 'PLATFORM',
        roles: ['super_admin'],
        scopes: ['*'],
        profile: { email, name: 'Platform Control' },
        mfaVerified: false,
        isSuperAdmin: true,
      });
      const session = this.sessions.get(sessionId)!;
      return { sessionId, expiresAt: session.expiresAt, requiresMfa: true };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    const settings = parseSettings(user.settings);
    const mfaSecret = typeof settings.mfaSecret === 'string' ? settings.mfaSecret : undefined;
    const mfaEnabled = Boolean(settings.mfaEnabled ?? mfaSecret);

    const roles = user.role ? [user.role.name] : ['user'];
    const scopes = Array.isArray(user.role?.permissions)
      ? (user.role?.permissions as string[])
      : [];

    const sessionId = this.createSession({
      userId: user.id,
      organizationId: user.organizationId,
      roles,
      scopes,
      profile: { email: user.email, name: user.name },
      mfaVerified: !mfaEnabled,
      isSuperAdmin: false,
    });

    const session = this.sessions.get(sessionId)!;

    if (!session.mfaVerified) {
      await emailService.sendMfaReminder(user.email);
    }

    return {
      sessionId,
      expiresAt: session.expiresAt,
      requiresMfa: !session.mfaVerified,
    };
  }

  async verifyMfa(sessionId: string, token: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }

    if (session.isSuperAdmin) {
      const secret = resolveSuperAdminMfaSecret();
      if (!secret) {
        throw new Error('Super admin MFA secret not set');
      }
      const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 2 });
      if (!ok) {
        throw new Error('Invalid MFA token');
      }
      session.mfaVerified = true;
      this.sessions.set(sessionId, session);
      return this.issueToken(sessionId);
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const settings = parseSettings(user.settings);
    const mfaSecret = typeof settings.mfaSecret === 'string' ? settings.mfaSecret : undefined;
    if (!mfaSecret) {
      throw new Error('MFA not configured for user');
    }

    const verified = speakeasy.totp.verify({
      secret: mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Invalid MFA token');
    }

    session.mfaVerified = true;
    this.sessions.set(sessionId, session);
    return this.issueToken(sessionId);
  }

  async validateToken(token: string) {
    const decoded = jwt.verify(token, this.jwtSecret) as SessionRecord & { iat: number; exp: number };
    const session = this.sessions.get(decoded.sessionId);
    if (!session) {
      throw new Error('Session expired');
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(decoded.sessionId);
      throw new Error('Session expired');
    }

    if (!session.mfaVerified) {
      throw new Error('MFA verification required');
    }

    session.expiresAt = this.extendExpiration();
    this.sessions.set(session.sessionId, session);
    return session;
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId) ?? null;
  }

  issueToken(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session expired');
    }

    const token = jwt.sign(
      {
        sessionId: session.sessionId,
        userId: session.userId,
        organizationId: session.organizationId,
        roles: session.roles,
        scopes: session.scopes,
        profile: session.profile,
      },
      this.jwtSecret,
      { expiresIn: `${this.sessionHours}h` },
    );

    return {
      jwt: token,
      session,
    };
  }

  async logout(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  private async authenticateSuperAdmin(password: string) {
    const storedHash = resolveSuperAdminPasswordHash();
    if (!storedHash) {
      return false;
    }
    return bcrypt.compare(password, storedHash);
  }

  private createSession(data: Omit<SessionRecord, 'sessionId' | 'expiresAt'>) {
    const sessionId = uuid();
    const expiresAt = this.extendExpiration();
    const record: SessionRecord = {
      ...data,
      sessionId,
      expiresAt,
    };
    this.sessions.set(sessionId, record);
    return sessionId;
  }

  private extendExpiration() {
    const expires = new Date();
    expires.setHours(expires.getHours() + this.sessionHours);
    return expires;
  }
}

export const authService = new AuthService();

export const serializeSession = (session: SessionRecord) => ({
  sessionId: session.sessionId,
  userId: session.userId,
  organizationId: session.organizationId,
  roles: session.roles,
  scopes: session.scopes,
  profile: session.profile,
  expiresAt: session.expiresAt.toISOString(),
});
