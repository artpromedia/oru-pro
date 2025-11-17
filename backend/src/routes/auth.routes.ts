import { Router, type Request, type Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

import { authService, serializeSession } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../lib/prisma';
import { emailService } from '../services/emailService';

const router = Router();

const ensureUserContext = (req: Request) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }
  return req.user;
};

const ensureAdmin = (req: Request) => {
  const user = ensureUserContext(req);
  const roles = user.roles ?? [];
  if (!roles.includes('admin') && !roles.includes('super_admin')) {
    const error = new Error('Admin privileges required');
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return user;
};

const handleValidation = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

router.post(
  '/login',
  [body('email').isEmail(), body('password').isString().isLength({ min: 8 })],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const result = await authService.login(req.body.email, req.body.password);
      const session = authService.getSession(result.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!result.requiresMfa && session.mfaVerified) {
        const issued = authService.issueToken(result.sessionId);
        res.json({ success: true, requiresMfa: false, token: issued.jwt, session: serializeSession(issued.session) });
        return;
      }

      res.json({
        success: true,
        requiresMfa: true,
        sessionId: result.sessionId,
        expiresAt: result.expiresAt.toISOString(),
      });
    } catch (error) {
      res.status(401).json({ success: false, message: (error as Error).message });
    }
  }),
);

router.post(
  '/mfa',
  [body('sessionId').isUUID(), body('token').isString().isLength({ min: 6, max: 8 })],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const issued = await authService.verifyMfa(req.body.sessionId, req.body.token);
      res.json({ success: true, requiresMfa: false, token: issued.jwt, session: serializeSession(issued.session) });
    } catch (error) {
      res.status(401).json({ success: false, message: (error as Error).message });
    }
  }),
);

router.get(
  '/session',
  asyncHandler(async (req: Request, res: Response) => {
    const bearer = req.header('authorization');
    if (!bearer?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authorization header missing' });
      return;
    }

    try {
      const session = await authService.validateToken(bearer.replace('Bearer ', '').trim());
      res.json({ success: true, session: serializeSession(session) });
    } catch (error) {
      res.status(401).json({ success: false, message: (error as Error).message });
    }
  }),
);

router.post(
  '/logout',
  [body('sessionId').optional().isUUID()],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const sessionId = req.body.sessionId as string | undefined;

    if (sessionId) {
      await authService.logout(sessionId);
      res.json({ success: true });
      return;
    }

    const bearer = req.header('authorization');
    if (bearer?.startsWith('Bearer ')) {
      try {
        const session = await authService.validateToken(bearer.replace('Bearer ', '').trim());
        await authService.logout(session.sessionId);
        res.json({ success: true });
        return;
      } catch (error) {
        res.status(400).json({ success: false, message: (error as Error).message });
        return;
      }
    }

    res.status(400).json({ success: false, message: 'Session identifier required' });
  }),
);

router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const user = ensureAdmin(req);
    const users = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    const payload = users.map((record) => ({
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role?.name ?? 'user',
      roleId: record.roleId,
      settings: record.settings,
      createdAt: record.createdAt,
      lastLogin: record.lastLogin,
    }));

    res.json({ success: true, data: payload });
  }),
);

router.post(
  '/users',
  [
    body('email').isEmail(),
    body('name').optional().isString().isLength({ min: 2 }),
    body('password').isString().isLength({ min: 8 }),
    body('roleId').isString().notEmpty(),
    body('sendInvite').optional().isBoolean(),
    body('mfaEnabled').optional().isBoolean(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const admin = ensureAdmin(req);

    const hashed = await bcrypt.hash(req.body.password, 10);
    const settings: Record<string, unknown> = {
      mfaEnabled: req.body.mfaEnabled ?? false,
    };

    try {
      const created = await prisma.user.create({
        data: {
          email: req.body.email,
          password: hashed,
          name: req.body.name,
          role: { connect: { id: req.body.roleId } },
          organization: { connect: { id: admin.organizationId } },
          settings: settings as Prisma.InputJsonValue,
        },
        include: { role: true },
      });

      if (req.body.sendInvite) {
        await emailService.sendInvite(created.email, req.body.password);
      }

      res.status(201).json({
        success: true,
        data: {
          id: created.id,
          email: created.email,
          role: created.role?.name ?? 'user',
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }),
);

router.patch(
  '/users/:id',
  [
    param('id').isString(),
    body('name').optional().isString().isLength({ min: 2 }),
    body('roleId').optional().isString(),
    body('mfaEnabled').optional().isBoolean(),
    body('mfaSecret').optional().isString().isLength({ min: 16 }),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const admin = ensureAdmin(req);

    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, organizationId: admin.organizationId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const settings = {
      ...((existing.settings as Record<string, unknown> | null) ?? {}),
    };

    if (req.body.mfaEnabled !== undefined) {
      settings.mfaEnabled = req.body.mfaEnabled;
    }
    if (req.body.mfaSecret) {
      settings.mfaSecret = req.body.mfaSecret;
    }

    const data: Prisma.UserUpdateInput = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.roleId) data.role = { connect: { id: req.body.roleId } };
    data.settings = settings as Prisma.InputJsonValue;

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data,
      include: { role: true },
    });

    res.json({ success: true, data: { id: updated.id, role: updated.role?.name ?? 'user', settings: updated.settings } });
  }),
);

router.post(
  '/users/:id/reset-password',
  [param('id').isString(), body('password').isString().isLength({ min: 8 }), body('notify').optional().isBoolean()],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const admin = ensureAdmin(req);

    const user = await prisma.user.findFirst({ where: { id: req.params.id, organizationId: admin.organizationId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const hashed = await bcrypt.hash(req.body.password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    if (req.body.notify) {
      await emailService.sendPasswordReset(user.email);
    }

    res.json({ success: true });
  }),
);

export default router;
