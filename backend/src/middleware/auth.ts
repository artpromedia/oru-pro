import { Request, Response, NextFunction } from 'express';

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { authService, type SessionRecord } from '../services/authService';

export interface AuthContext {
  tenantId: string;
  userId?: string;
  roles: string[];
  scopes: string[];
}

export interface UserContext {
  id: string;
  organizationId: string;
  name?: string;
  email?: string;
  roles: string[];
  scopes: string[];
  metadata?: Record<string, unknown>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      user?: UserContext;
    }
  }
}

const parseCsvHeader = (value?: string | string[]): string[] => {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(',') : value;
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const tenantId = (req.header('x-tenant-id') || process.env.DEFAULT_TENANT || 'demo').trim();
  const userId = req.header('x-user-id') || undefined;
  const roles = parseCsvHeader(req.header('x-user-roles'));
  const scopes = parseCsvHeader(req.header('x-user-scopes'));

  const assignUser = (overrides: Partial<UserContext> = {}) => {
    req.user = {
      id: userId ?? 'system',
      organizationId: overrides.organizationId ?? tenantId,
      name: overrides.name ?? req.header('x-user-name') ?? undefined,
      email: overrides.email ?? req.header('x-user-email') ?? undefined,
      roles: overrides.roles ?? (roles.length ? roles : ['user']),
      scopes: overrides.scopes ?? (scopes.length ? scopes : []),
      metadata: overrides.metadata,
    };
  };

  const assignFromSession = (session: SessionRecord) => {
    req.auth = {
      tenantId: session.organizationId,
      userId: session.userId,
      roles: session.roles,
      scopes: session.scopes,
    };

    req.user = {
      id: session.userId,
      organizationId: session.organizationId,
      name: session.profile.name ?? undefined,
      email: session.profile.email,
      roles: session.roles,
      scopes: session.scopes,
    };
  };

  req.auth = {
    tenantId,
    userId,
    roles,
    scopes,
  };

  (async () => {
    const bearer = req.header('authorization');
    if (bearer?.startsWith('Bearer ')) {
      const token = bearer.replace('Bearer ', '').trim();
      try {
        const session = await authService.validateToken(token);
        assignFromSession(session);
        return;
      } catch (error) {
        logger.debug('Bearer token validation failed, falling back to header context', {
          reason: (error as Error).message,
        });
      }
    }

    if (!userId) {
      assignUser();
      return;
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          organizationId: true,
          role: {
            select: { name: true, permissions: true },
          },
        },
      });

      if (dbUser) {
        assignUser({
          id: dbUser.id,
          organizationId: dbUser.organizationId,
          name: dbUser.name ?? undefined,
          email: dbUser.email ?? undefined,
          roles: roles.length ? roles : [dbUser.role?.name ?? 'user'],
          scopes:
            scopes.length
              ? scopes
              : Array.isArray(dbUser.role?.permissions)
                ? (dbUser.role?.permissions as string[])
                : [],
          metadata: {
            role: dbUser.role?.name,
            permissions: dbUser.role?.permissions ?? [],
          },
        });
        return;
      }
    } catch (error) {
      logger.warn('Failed to hydrate user context from database', { error, userId });
    }

    assignUser();
  })()
    .then(() => next())
    .catch(next);
};

export {}; // ensure this file is treated as a module for the global declaration
