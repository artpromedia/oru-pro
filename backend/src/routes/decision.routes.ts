import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Prisma, type Decision, type User } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { DecisionNoiseAgent } from '../agents/decisionNoiseAgent';
import { publishEvent } from '../services/eventBus';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const noiseAgent = new DecisionNoiseAgent();

const ensureUserContext = (req: Request) => {
  if (!req.user) {
    throw new Error('Authentication context missing');
  }
  return req.user;
};

const handleValidation = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

router.get(
  '/',
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'deferred']),
    query('type').optional().isString(),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('projectId').optional().isString(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);
    const { status, type, priority, projectId } = req.query;

    const where: Record<string, unknown> = { organizationId: user.organizationId };
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;

    try {
      const decisions = await prisma.decision.findMany({
        where,
        include: {
          requester: {
            select: { id: true, name: true, email: true },
          },
          project: true,
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      const metrics = {
        total: decisions.length,
        pending: decisions.filter((d) => d.status === 'pending').length,
        overdue: decisions.filter(
          (d) => d.status === 'pending' && d.deadline && new Date(d.deadline) < new Date(),
        ).length,
        avgDecisionTime: await calculateAvgDecisionTime(user.organizationId),
        biasDetectionRate:
          decisions.length > 0
            ? (decisions.filter((d) => d.biasDetected).length / decisions.length) * 100
            : 0,
      };

      res.json({
        success: true,
        data: decisions,
        metrics,
      });
    } catch (error) {
      logger.error('Error fetching decisions', { error });
      res.status(500).json({ success: false, error: 'Failed to fetch decisions' });
    }
  }),
);

router.post(
  '/',
  [
    body('title').notEmpty().isString(),
    body('description').notEmpty().isString(),
    body('type').notEmpty().isString(),
    body('priority').isIn(['low', 'medium', 'high', 'critical']),
    body('context').isObject(),
    body('alternatives').isObject(),
    body('criteria').isObject(),
    body('deadline').optional().isISO8601(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);

    try {
      const historicalDecisions = await getHistoricalDecisions(req.body.type, user.organizationId);
      const noiseAnalysis = await noiseAgent.analyzeDecision({
        context: req.body.context,
        alternatives: req.body.alternatives,
        criteria: req.body.criteria,
        historicalDecisions,
      });

      const aiRecommendation = await noiseAgent.generateRecommendation(req.body);

      const decision = await prisma.decision.create({
        data: {
          ...req.body,
          requesterId: user.id,
          organizationId: user.organizationId,
          status: 'pending',
          noiseFactors: noiseAnalysis.noiseFactors,
          biasDetected: noiseAnalysis.biasDetected,
          aiRecommendation: aiRecommendation.recommendation,
          aiConfidence: aiRecommendation.confidence,
        },
        include: {
          requester: true,
        },
      });

      await notifyStakeholders(decision);

      await publishEvent('decision.created', {
        decisionId: decision.id,
        priority: decision.priority,
        requester: decision.requester?.name,
      });

      res.status(201).json({
        success: true,
        data: decision,
        analysis: {
          noiseFactors: noiseAnalysis,
          aiRecommendation,
        },
      });
    } catch (error) {
      logger.error('Error creating decision', { error });
      res.status(500).json({ success: false, error: 'Failed to create decision' });
    }
  }),
);

router.post(
  '/:id/decide',
  [
    param('id').isString(),
    body('choice').notEmpty().isString(),
    body('reasoning').notEmpty().isString(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);

    try {
      const { id } = req.params;
      const { choice, reasoning } = req.body as { choice: string; reasoning: string };

      const decision = await prisma.decision.findFirst({
        where: {
          id,
          organizationId: user.organizationId,
          status: 'pending',
        },
      });

      if (!decision) {
        res.status(404).json({ success: false, error: 'Decision not found or already resolved' });
        return;
      }

      const consistencyCheck = await noiseAgent.checkConsistency(decision, choice, user.organizationId);

      const updated = await prisma.decision.update({
        where: { id },
        data: {
          status: 'approved',
          choice,
          reasoning,
          decidedBy: user.id,
          decidedAt: new Date(),
        },
      });

      await executeDecisionActions(updated);
      await logDecisionAudit(updated, user);

      await publishEvent('decision.made', {
        decisionId: id,
        choice,
        decidedBy: user.name ?? user.id,
      });

      res.json({ success: true, data: updated, consistencyCheck });
    } catch (error) {
      logger.error('Error making decision', { error });
      res.status(500).json({ success: false, error: 'Failed to make decision' });
    }
  }),
);

router.get(
  '/:id/analysis',
  param('id').isString(),
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);

    try {
      const { id } = req.params;
      const decision = await prisma.decision.findFirst({
        where: {
          id,
          organizationId: user.organizationId,
        },
      });

      if (!decision) {
        res.status(404).json({ success: false, error: 'Decision not found' });
        return;
      }

      const analysis = await noiseAgent.comprehensiveAnalysis(decision);
      const similarDecisions = await findSimilarDecisions(decision);
      const predictions = await predictOutcomes(decision);

      res.json({
        success: true,
        data: {
          decision,
          analysis,
          similarDecisions,
          predictions,
        },
      });
    } catch (error) {
      logger.error('Error analyzing decision', { error });
      res.status(500).json({ success: false, error: 'Failed to analyze decision' });
    }
  }),
);

router.post(
  '/batch-review',
  body('decisionIds').isArray({ min: 1 }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);

    try {
      const { decisionIds } = req.body as { decisionIds: string[] };

      const decisions = await prisma.decision.findMany({
        where: {
          id: { in: decisionIds },
          organizationId: user.organizationId,
          status: 'pending',
        },
      });

      const batchAnalysis = await noiseAgent.batchAnalysis(decisions);

      res.json({
        success: true,
        data: {
          decisions,
          analysis: batchAnalysis,
          recommendations: batchAnalysis.recommendations,
        },
      });
    } catch (error) {
      logger.error('Error in batch review', { error });
      res.status(500).json({ success: false, error: 'Batch review failed' });
    }
  }),
);

router.get(
  '/metrics',
  query('period').optional().isIn(['day', 'week', 'month', 'quarter']),
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);

    try {
      const period = (req.query.period as string) ?? 'month';
      const startDate = getStartDate(period);

      const decisions = await prisma.decision.findMany({
        where: {
          organizationId: user.organizationId,
          createdAt: { gte: startDate },
        },
      });

      const metrics = {
        totalDecisions: decisions.length,
        byStatus: groupBy(decisions, 'status'),
        byType: groupBy(decisions, 'type'),
        byPriority: groupBy(decisions, 'priority'),
        averageDecisionTime: calculateAvgTime(decisions),
        biasDetectionRate:
          decisions.length > 0
            ? (decisions.filter((d) => d.biasDetected).length / decisions.length) * 100
            : 0,
        aiAcceptanceRate:
          decisions.length > 0
            ? (decisions.filter((d) => {
                const ai = d.aiRecommendation as { choice?: string } | null;
                return ai?.choice && d.choice && ai.choice === d.choice;
              }).length /
                decisions.length) *
              100
            : 0,
        consistencyScore: await calculateConsistencyScore(decisions),
      };

      res.json({
        success: true,
        data: metrics,
        period,
        startDate,
      });
    } catch (error) {
      logger.error('Error fetching metrics', { error });
      res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
    }
  }),
);

async function calculateAvgDecisionTime(organizationId: string) {
  const decisions = await prisma.decision.findMany({
    where: {
      organizationId,
      status: { not: 'pending' },
      decidedAt: { not: null },
    },
  });

  if (decisions.length === 0) return 0;

  const totalTime = decisions.reduce((sum, d) => {
    const decidedAt = d.decidedAt ? new Date(d.decidedAt).getTime() : 0;
    const createdAt = new Date(d.createdAt).getTime();
    return sum + Math.max(decidedAt - createdAt, 0);
  }, 0);

  return Math.round(totalTime / decisions.length / (1000 * 60 * 60));
}

async function getHistoricalDecisions(type: string, organizationId: string) {
  return prisma.decision.findMany({
    where: {
      type,
      organizationId,
      status: { not: 'pending' },
    },
    take: 20,
    orderBy: { decidedAt: 'desc' },
  });
}

async function notifyStakeholders(decision: Decision) {
  const stakeholders = await getStakeholders(decision);

  await Promise.all(
    stakeholders.map((stakeholder) =>
      prisma.notification.create({
        data: {
          userId: stakeholder.id,
          type: decision.priority === 'critical' ? 'alert' : 'info',
          title: `Decision Required: ${decision.title}`,
          message: decision.description,
          data: { decisionId: decision.id },
        },
      }),
    ),
  );
}

async function executeDecisionActions(decision: Decision) {
  const context = (decision.context ?? {}) as Record<string, unknown>;
  switch (decision.type) {
    case 'procurement':
      if ((decision.choice ?? '').toLowerCase() === 'approve') {
        await createPurchaseOrder(decision, context);
      }
      break;
    case 'qa_release':
      await updateQAStatus(context, decision.choice ?? 'pending');
      break;
    case 'production':
      await updateProductionSchedule(decision, context, decision.choice ?? 'pending');
      break;
    default:
      break;
  }
}

async function logDecisionAudit(decision: Decision, user: User | { id: string }) {
  logger.info('Decision made', {
    decisionId: decision.id,
    type: decision.type,
    choice: decision.choice,
    decidedBy: user.id,
    timestamp: new Date(),
  });
}

async function findSimilarDecisions(decision: Decision) {
  return prisma.decision.findMany({
    where: {
      organizationId: decision.organizationId,
      type: decision.type,
      id: { not: decision.id },
      status: { not: 'pending' },
    },
    take: 5,
    orderBy: { decidedAt: 'desc' },
  });
}

async function predictOutcomes(decision: Decision) {
  const priorityWeight = decision.priority === 'critical' ? 0.8 : decision.priority === 'high' ? 0.75 : 0.7;
  return {
    successProbability: priorityWeight + 0.05,
    risks: ['Supply chain delay', 'Quality variance'],
    opportunities: ['Cost savings', 'Faster delivery'],
    confidence: priorityWeight + 0.12,
  };
}

async function calculateConsistencyScore(decisions: Decision[]) {
  if (!decisions.length) return 100;
  const grouped = groupBy(decisions, 'type');
  let totalScore = 0;
  let count = 0;

  Object.keys(grouped).forEach((group) => {
    const typeDecisions = grouped[group];
    if (typeDecisions.length > 1) {
      const consistency = calculateTypeConsistency(typeDecisions);
      totalScore += consistency;
      count += 1;
    }
  });

  return count > 0 ? totalScore / count : 100;
}

function groupBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const groupKey = String(item[key] ?? 'unknown');
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}

function calculateAvgTime(decisions: Decision[]) {
  const completed = decisions.filter((d) => d.decidedAt);
  if (completed.length === 0) return 0;

  const totalTime = completed.reduce((sum, d) => {
    const decidedAt = d.decidedAt ? new Date(d.decidedAt).getTime() : 0;
    return sum + Math.max(decidedAt - new Date(d.createdAt).getTime(), 0);
  }, 0);

  return Math.round(totalTime / completed.length / (1000 * 60 * 60));
}

function calculateTypeConsistency(decisions: Decision[]) {
  const choices = decisions.map((d) => d.choice).filter(Boolean) as string[];
  if (!choices.length) return 100;
  const uniqueChoices = new Set(choices);
  return (1 - (uniqueChoices.size - 1) / choices.length) * 100;
}

function getStartDate(period: string) {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'month':
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

async function getStakeholders(decision: Decision) {
  return prisma.user.findMany({
    where: {
      organizationId: decision.organizationId,
      role: {
        is: {
          permissions: {
            array_contains: [`decision.${decision.type}`],
          },
        },
      },
    },
  });
}

async function createPurchaseOrder(decision: Decision, context: Record<string, unknown>) {
  const supplierId = getString(context, 'supplierId') ?? ((context.supplier as { id?: string } | undefined)?.id);
  if (!supplierId) {
    logger.warn('Skipping PO creation – missing supplierId', { decisionId: decision.id });
    return;
  }

  const items = parseProcurementItems(context.items ?? context.lineItems);
  if (!items.length) {
    logger.warn('Skipping PO creation – no items provided', { decisionId: decision.id });
    return;
  }

  const poNumber = getString(context, 'poNumber') ?? generatePoNumber(decision.id);
  const expectedDate = parseDateInput(context.expectedDate) ?? addDays(new Date(), 7);
  const totalAmount = typeof context.totalAmount === 'number'
    ? context.totalAmount
    : items.reduce((sum, item) => sum + item.quantity * (item.unitPrice ?? 0), 0);

  const itemsPayload = items as Prisma.InputJsonValue;

  try {
    const procurement = await prisma.procurement.create({
      data: {
        poNumber,
        supplierId,
        status: getString(context, 'status') ?? 'draft',
        orderDate: new Date(),
        expectedDate,
        items: itemsPayload,
        totalAmount,
        currency: getString(context, 'currency') ?? 'USD',
        terms: getString(context, 'terms'),
        organizationId: decision.organizationId,
      },
    });

    logger.info('Created procurement order from decision', {
      decisionId: decision.id,
      procurementId: procurement.id,
    });
  } catch (error) {
    logger.error('Failed to create purchase order from decision', {
      decisionId: decision.id,
      error,
    });
  }
}

async function updateQAStatus(context: Record<string, unknown>, choice: string) {
  const inventoryId = context.inventoryId as string | undefined;
  if (!inventoryId) return;
  await prisma.inventory.update({
    where: { id: inventoryId },
    data: { qaStatus: choice === 'approve' ? 'approved' : 'rejected' },
  });
}

async function updateProductionSchedule(decision: Decision, context: Record<string, unknown>, choice: string) {
  const productionId = getString(context, 'productionId');
  const status = mapChoiceToProductionStatus(choice);

  try {
    if (productionId) {
      await prisma.production.update({
        where: { id: productionId },
        data: {
          status,
          endDate: status === 'completed' ? new Date() : undefined,
        },
      });

      logger.info('Updated production order from decision', {
        decisionId: decision.id,
        productionId,
        status,
      });
      return;
    }

    const resolvedLineId = await resolveProductionLineId(getString(context, 'lineId'), getString(context, 'lineName'));
    if (!resolvedLineId) {
      logger.warn('Unable to resolve production line for decision automation', { decisionId: decision.id });
      return;
    }

    const bomPayload = ((context.bom as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull);

    await prisma.production.create({
      data: {
        orderNumber: getString(context, 'orderNumber') ?? generateProductionOrderNumber(decision.id),
        productSku: getString(context, 'productSku') ?? 'UNKNOWN',
        quantity: Number(context.quantity ?? context.plannedQuantity ?? 0) || 0,
        status,
        startDate: parseDateInput(context.startDate) ?? new Date(),
        endDate: parseDateInput(context.endDate),
        lineId: resolvedLineId,
        organizationId: decision.organizationId,
        bom: bomPayload,
      },
    });

    logger.info('Created production schedule from decision', {
      decisionId: decision.id,
      lineId: resolvedLineId,
      status,
    });
  } catch (error) {
    logger.error('Failed to sync production schedule from decision', {
      decisionId: decision.id,
      error,
    });
  }
}

type ProcurementItem = {
  sku: string;
  quantity: number;
  unitPrice?: number;
  description?: string;
};

function parseProcurementItems(raw: unknown): ProcurementItem[] {
  if (!Array.isArray(raw)) return [];
  const normalized: ProcurementItem[] = [];
  raw.forEach((item) => {
    if (typeof item !== 'object' || item === null) return;
    const record = item as Record<string, unknown>;
    const sku = getString(record, 'sku') ?? getString(record, 'skuCode');
    const quantity = Number(record.quantity ?? record.qty ?? 0);
    if (!sku || quantity <= 0) return;
    const unitPriceRaw = record.unitPrice ?? record.price;
    const numericPrice = typeof unitPriceRaw === 'number' ? unitPriceRaw : Number(unitPriceRaw ?? 0);
    const unitPrice = Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : undefined;
    const description = getString(record, 'description');
    normalized.push({ sku, quantity, unitPrice, description });
  });
  return normalized;
}

function getString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' && value.trim().length ? value.trim() : undefined;
}

function parseDateInput(value: unknown): Date | null {
  if (typeof value === 'string' || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generatePoNumber(decisionId: string): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12);
  return `DEC-${decisionId.slice(0, 6).toUpperCase()}-${timestamp}`;
}

function generateProductionOrderNumber(decisionId: string): string {
  return `PROD-${decisionId.slice(-6)}-${Date.now().toString().slice(-6)}`;
}

function mapChoiceToProductionStatus(choice: string): string {
  const normalized = choice.toLowerCase();
  if (normalized.includes('complete')) return 'completed';
  if (normalized.includes('start') || normalized.includes('launch') || normalized.includes('approve')) return 'in_progress';
  if (normalized.includes('hold') || normalized.includes('wait')) return 'on_hold';
  return 'planned';
}

async function resolveProductionLineId(lineId?: string, lineName?: string): Promise<string | undefined> {
  if (lineId) return lineId;
  if (lineName) {
    const byName = await prisma.productionLine.findFirst({ where: { name: lineName } });
    if (byName) return byName.id;
  }
  const fallback = await prisma.productionLine.findFirst({ orderBy: { name: 'asc' } });
  return fallback?.id;
}

export default router;
