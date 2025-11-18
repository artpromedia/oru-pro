import { Request, Response, Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../middleware/errorHandler';
import { commsService } from '../services/commsService';
import { presenceService } from '../services/presenceService';

const router = Router();

const resolveTenant = (req: Request) => req.auth?.tenantId ?? req.user?.organizationId ?? 'demo';
const resolveUser = (req: Request) => ({
  id: req.user?.id ?? req.auth?.userId ?? 'system',
  name: req.user?.name ?? req.header('x-user-name') ?? 'System',
  avatar: req.header('x-user-avatar') ?? undefined,
});

router.get('/channels', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const channels = await commsService.listChannels(tenantId, resolveUser(req).id);
  res.json({ channels });
}));

router.get('/channels/:channelId', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const channel = await commsService.getChannelDetails(tenantId, req.params.channelId);
  res.json({ channel });
}));

router.get('/channels/:channelId/messages', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const { cursor, limit } = req.query;
  const messages = await commsService.getMessages(tenantId, req.params.channelId, {
    cursor: typeof cursor === 'string' ? cursor : undefined,
    limit: typeof limit === 'string' ? Number(limit) : undefined,
  });
  res.json({ messages });
}));

router.post('/channels/:channelId/messages', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const user = resolveUser(req);
  const { content, attachments, metadata, threadParentId } = req.body ?? {};
  if (!content || typeof content !== 'string') {
    throw new HttpError(400, 'Message content required');
  }

  const message = await commsService.createMessage(tenantId, {
    channelId: req.params.channelId,
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    content,
    attachments,
    metadata,
    threadParentId,
  });

  res.status(201).json({ message });
}));

router.patch('/messages/:messageId', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const user = resolveUser(req);
  const { content, attachments, metadata } = req.body ?? {};
  if (!content || typeof content !== 'string') {
    throw new HttpError(400, 'Message content required');
  }

  const message = await commsService.editMessage(tenantId, {
    messageId: req.params.messageId,
    authorId: user.id,
    content,
    attachments,
    metadata,
  });

  res.json({ message });
}));

router.delete('/messages/:messageId', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const user = resolveUser(req);
  const result = await commsService.deleteMessage(tenantId, req.params.messageId, user.id);
  res.json(result);
}));

router.post('/messages/:messageId/reactions', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const user = resolveUser(req);
  const emoji = req.body?.emoji;
  if (!emoji || typeof emoji !== 'string') {
    throw new HttpError(400, 'Emoji required');
  }
  const message = await commsService.toggleReaction(tenantId, req.params.messageId, user.id, user.name, emoji);
  res.json({ message });
}));

router.post('/messages/:messageId/pin', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const { isPinned } = req.body ?? {};
  const message = await commsService.pinMessage(tenantId, req.params.messageId, Boolean(isPinned));
  res.json({ message });
}));

router.get('/presence', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  res.json({ presence: presenceService.list(tenantId) });
}));

export default router;
