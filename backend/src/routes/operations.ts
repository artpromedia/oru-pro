import { Request, Response, Router } from 'express';
import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const resolveTenant = (req: Request): string => req.auth?.tenantId ?? 'demo';
const EXPIRY_LOOKAHEAD_DAYS = Number(process.env.EXPIRY_LOOKAHEAD_DAYS ?? 14);
const DECISION_BACKLOG_LIMIT = Number(process.env.DECISION_BACKLOG_LIMIT ?? 5);
const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

const priorityScore = (priority?: string) => {
  const index = PRIORITY_ORDER.findIndex((value) => value === (priority ?? '').toLowerCase());
  return index === -1 ? PRIORITY_ORDER.length : index;
};

router.get('/inventory/summary', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const now = new Date();
  const expiryHorizon = new Date(now.getTime() + EXPIRY_LOOKAHEAD_DAYS * 86_400_000);

  const [items, qaHold, expiringLots, coldChainBreaches, latestMovement] = await prisma.$transaction([
    prisma.inventory.count({ where: { organizationId: tenantId } }),
    prisma.inventory.count({ where: { organizationId: tenantId, qaStatus: 'qa_hold' } }),
    prisma.inventory.count({
      where: {
        organizationId: tenantId,
        expiryDate: { gte: now, lte: expiryHorizon },
      },
    }),
    prisma.inventory.count({
      where: {
        organizationId: tenantId,
        qaHoldReason: { contains: 'cold', mode: 'insensitive' },
      },
    }),
    prisma.inventoryMovement.findFirst({
      where: { inventory: { organizationId: tenantId } },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }),
  ]);

  res.json({
    tenantId,
    items,
    qaHold,
    expiringLots,
    coldChainBreaches,
    updatedAt: (latestMovement?.timestamp ?? now).toISOString(),
  });
}));

router.get('/production/lines', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);

  const lines = await prisma.productionLine.findMany({
    where: { productions: { some: { organizationId: tenantId } } },
    include: {
      productions: {
        where: { organizationId: tenantId },
        orderBy: { startDate: 'desc' },
        take: 1,
        select: { orderNumber: true, status: true },
      },
      maintenance: {
        orderBy: { scheduledDate: 'desc' },
        take: 1,
        select: { scheduledDate: true, type: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.json({
    lines: lines.map((line) => ({
      id: line.id,
      name: line.name,
      status: line.status,
      oee: Number(line.oee ?? 0),
      capacity: line.capacity,
      currentOrder: line.productions[0]?.orderNumber ?? null,
      currentOrderStatus: line.productions[0]?.status ?? null,
      nextMaintenance: line.maintenance[0]?.scheduledDate?.toISOString() ?? null,
      maintenanceType: line.maintenance[0]?.type ?? null,
    })),
  });
}));

router.get('/procurement/purchase-orders', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const procurements = await prisma.procurement.findMany({
    where: { organizationId: tenantId },
    select: {
      status: true,
      terms: true,
      approvals: { where: { status: 'pending' }, select: { id: true } },
      receipts: { select: { id: true }, take: 1 },
    },
  });

  const approvalsRequired = procurements.filter((po) => po.approvals.length > 0).length;
  const pendingReceipts = procurements.filter((po) => ['confirmed', 'sent'].includes(po.status) && po.receipts.length === 0).length;
  const expedited = procurements.filter((po) => (po.terms ?? '').toLowerCase().includes('expedite') || (po.terms ?? '').toLowerCase().includes('rush')).length;

  res.json({ approvalsRequired, pendingReceipts, expedited });
}));

router.get('/decisions/pending', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const decisions = await prisma.decision.findMany({
    where: { organizationId: tenantId, status: 'pending' },
    take: DECISION_BACKLOG_LIMIT * 2,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      priority: true,
      deadline: true,
      title: true,
      aiRecommendation: true,
      aiConfidence: true,
    },
  });

  const backlog = decisions
    .sort((a, b) => priorityScore(a.priority) - priorityScore(b.priority) || ((a.deadline ?? new Date(8640000000000000)).getTime() - (b.deadline ?? new Date(8640000000000000)).getTime()))
    .slice(0, DECISION_BACKLOG_LIMIT)
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      priority: item.priority,
      deadline: item.deadline?.toISOString() ?? null,
      aiRecommendation: item.aiRecommendation,
      aiConfidence: item.aiConfidence,
    }));

  res.json({ backlog });
}));

router.get('/agents/activity', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);

  const [active, idle, errors, lastActivity] = await prisma.$transaction([
    prisma.agent.count({ where: { organizationId: tenantId, status: 'active' } }),
    prisma.agent.count({ where: { organizationId: tenantId, status: 'idle' } }),
    prisma.agent.count({ where: { organizationId: tenantId, status: { in: ['error', 'maintenance'] } } }),
    prisma.agentActivity.findFirst({
      where: { agent: { organizationId: tenantId } },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }),
  ]);

  res.json({
    active,
    idle,
    errors,
    lastRun: (lastActivity?.timestamp ?? new Date()).toISOString(),
  });
}));

router.post('/events/:channel', (req: Request, res: Response) => {
  const io = req.app.get('io') as Server | undefined;
  if (!io) {
    throw new HttpError(503, 'Realtime socket not initialized');
  }

  const { channel } = req.params;
  const payload = req.body ?? {};
  io.to(channel).emit('operations:event', payload);

  res.status(202).json({ success: true, channel });
});

export default router;
