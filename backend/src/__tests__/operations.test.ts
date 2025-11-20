import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    $transaction: jest.fn(),
    decision: { findMany: jest.fn() },
    inventory: { count: jest.fn() },
    inventoryMovement: { findFirst: jest.fn() },
  } satisfies Record<string, unknown>;

  return { prisma: mockPrisma };
});

describe('operations routes', () => {
  const transactionMock = prisma.$transaction as jest.Mock;
  const decisionFindManyMock = prisma.decision.findMany as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('summarizes inventory telemetry for the requested tenant', async () => {
    const timestamp = new Date('2024-07-01T12:00:00Z');
    transactionMock.mockResolvedValue([120, 8, 4, 2, { timestamp }]);

    const response = await request(app)
      .get('/api/operations/inventory/summary')
      .set('x-tenant-id', 'acme');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      tenantId: 'acme',
      items: 120,
      qaHold: 8,
      expiringLots: 4,
      coldChainBreaches: 2,
      updatedAt: timestamp.toISOString(),
    });
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it('limits decision backlog and sorts by priority + deadline', async () => {
    const decisions = [
      { id: '1', type: 'inventory', priority: 'critical', deadline: new Date('2025-01-01T10:00:00Z'), title: 'Critical', aiRecommendation: 'ship', aiConfidence: 0.9 },
      { id: '2', type: 'procurement', priority: 'high', deadline: new Date('2025-01-01T09:00:00Z'), title: 'High', aiRecommendation: 'order', aiConfidence: 0.8 },
      { id: '3', type: 'logistics', priority: 'medium', deadline: new Date('2025-01-02T09:00:00Z'), title: 'Medium', aiRecommendation: 'reroute', aiConfidence: 0.7 },
      { id: '4', type: 'production', priority: 'low', deadline: new Date('2025-01-03T09:00:00Z'), title: 'Low', aiRecommendation: 'wait', aiConfidence: 0.6 },
      { id: '5', type: 'quality', priority: 'high', deadline: new Date('2024-12-31T09:00:00Z'), title: 'High-early', aiRecommendation: 'audit', aiConfidence: 0.85 },
      { id: '6', type: 'inventory', priority: 'medium', deadline: null, title: 'Overflow', aiRecommendation: 'hold', aiConfidence: 0.5 },
    ];

    decisionFindManyMock.mockResolvedValue(decisions);

    const response = await request(app)
      .get('/api/operations/decisions/pending')
      .set('x-tenant-id', 'demo');

    expect(response.status).toBe(200);
    expect(response.body.backlog).toHaveLength(5); // default backlog limit
    expect(response.body.backlog[0]).toMatchObject({ id: '1', priority: 'critical' });
    expect(response.body.backlog[1]).toMatchObject({ id: '5', priority: 'high' });
    expect(response.body.backlog[2]).toMatchObject({ id: '2', priority: 'high' });
    expect(decisionFindManyMock).toHaveBeenCalledTimes(1);
  });
});
