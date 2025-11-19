import { Request, Response, Router } from 'express';
import { prisma, Prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const DEFAULT_TENANT = process.env.DEFAULT_TENANT ?? 'demo';
const MAX_LIMIT = Number(process.env.INVENTORY_SNAPSHOT_LIMIT ?? 500);

export type InventorySnapshot = {
  facilityId: string;
  sku: string;
  quantityOnHand: number;
  quantityOnHold: number;
  unit: string;
  updatedAt: string;
};

const resolveTenant = (req: Request): string => {
  if (typeof req.query.tenantId === 'string' && req.query.tenantId.trim().length > 0) {
    return req.query.tenantId.trim();
  }

  return req.auth?.tenantId ?? DEFAULT_TENANT;
};

const parseLimit = (value: unknown) => {
  if (typeof value !== 'string') return Math.min(200, MAX_LIMIT);
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return Math.min(200, MAX_LIMIT);
  return Math.max(1, Math.min(parsed, MAX_LIMIT));
};

const formatFacilityId = (record: {
  facilityId: string | null;
  facility?: { code: string | null; name: string | null } | null;
  warehouse?: { code: string | null; name: string | null } | null;
  location: string | null;
}) => {
  return (
    record.facility?.code ??
    record.facility?.name ??
    record.facilityId ??
    record.warehouse?.code ??
    record.warehouse?.name ??
    record.location ??
    'unassigned'
  );
};

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = resolveTenant(req);
    const limit = parseLimit(req.query.limit);
    const qaFilter = typeof req.query.qa === 'string' ? req.query.qa.toLowerCase() : undefined;
    const coldChainOnly = req.query.coldChain === 'true';

    const snapshots = await prisma.inventory.findMany({
      where: {
        organizationId: tenantId,
        ...(qaFilter === 'hold' ? { qaStatus: 'qa_hold' } : {}),
        ...(qaFilter === 'released' ? { qaStatus: 'approved' } : {}),
  ...(coldChainOnly ? { temperature: { not: Prisma.JsonNull } } : {}),
      },
      select: {
        sku: true,
        quantityOnHand: true,
        quantityOnHold: true,
        unit: true,
        uom: true,
        facilityId: true,
        facility: { select: { code: true, name: true } },
        warehouse: { select: { code: true, name: true } },
        location: true,
        lastUpdated: true,
      },
      orderBy: { lastUpdated: 'desc' },
      take: limit,
    });

    const response: InventorySnapshot[] = snapshots.map((record) => ({
      facilityId: formatFacilityId(record),
      sku: record.sku,
      quantityOnHand: Number(record.quantityOnHand ?? 0),
      quantityOnHold: Number(record.quantityOnHold ?? 0),
      unit: record.unit ?? record.uom ?? 'EA',
      updatedAt: record.lastUpdated.toISOString(),
    }));

    res.json(response);
  })
);

export default router;
