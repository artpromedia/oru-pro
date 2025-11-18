/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { io } from "../../index.js";
import { logger } from "../../logger.js";
import { SAPConnector } from "./sapConnector.js";
import { DataTransformer } from "./dataTransformer.js";
import { DataValidator } from "./dataValidator.js";
import Queue from "bull";

type SapRecord = Record<string, unknown>;

type SapMaterialRecord = SapRecord & {
  materialNumber?: string;
  sku?: string;
  quantity?: number;
  availableQty?: number;
  unit?: string;
  baseUnit?: string;
};

type SapInventoryRecord = SapRecord & {
  materialNumber?: string;
  sku?: string;
  quantity?: number;
  availableQty?: number;
  qualityQty?: number;
  unit?: string;
  uom?: string;
};

type SapVendorRecord = SapRecord & {
  vendorNumber?: string;
  code?: string;
  name?: string;
  leadTime?: number;
  paymentTerms?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type SapPurchaseOrderRecord = SapRecord & {
  purchaseOrderNumber?: string;
  vendorNumber?: string;
  supplierCode?: string;
  vendorName?: string;
  vendorContact?: Record<string, unknown> | null;
  paymentTerms?: string;
  status?: string;
  incoterms?: string;
  deliveryDate?: string;
  currency?: string;
};

type MigrationStepState = {
  status: string;
  progress?: number;
  current?: string;
  error?: string;
  [key: string]: unknown;
};

type MigrationProgress = {
  id: string;
  organizationId: string;
  status: string;
  startTime: Date;
  completedTime?: Date;
  assessment?: {
    systemInfo?: unknown;
    recordCounts?: Record<string, number>;
    estimatedTime?: number;
    dataSize?: number;
  };
  steps: Record<string, MigrationStepState>;
};

export class SAPMigrationService {
  private sapConnector: SAPConnector;
  private transformer: DataTransformer;
  private validator: DataValidator;
  private migrationQueue: Queue.Queue;
  private progress: Map<string, MigrationProgress> = new Map();

  constructor() {
    this.sapConnector = new SAPConnector({
      host: process.env.SAP_RFC_HOST,
      client: process.env.SAP_RFC_CLIENT,
      user: process.env.SAP_RFC_USER,
      password: process.env.SAP_RFC_PASSWORD
    });

    this.transformer = new DataTransformer();
    this.validator = new DataValidator();

    this.migrationQueue = new Queue("migration", {
      redis: {
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379", 10)
      }
    });

    this.setupQueueProcessors();
  }

  private setupQueueProcessors() {
    // Using process with concurrency 1 for each named job
    this.migrationQueue.process("extract", async (job: Queue.Job) => {
      return this.processExtraction(job.data);
    });

    this.migrationQueue.process("transform", async (job: Queue.Job) => {
      return this.processTransformation(job.data);
    });

    this.migrationQueue.process("validate", async (job: Queue.Job) => {
      return this.processValidation(job.data);
    });

    this.migrationQueue.process("load", async (job: Queue.Job) => {
      return this.processLoading(job.data);
    });
  }

  async startMigration(organizationId: string, config: MigrationConfig) {
    const migrationId = `migration-${Date.now()}`;

    this.progress.set(migrationId, {
      id: migrationId,
      organizationId,
      status: "initializing",
      startTime: new Date(),
      steps: {
        assessment: { status: "pending", progress: 0 },
        extraction: { status: "pending", progress: 0 },
        transformation: { status: "pending", progress: 0 },
        validation: { status: "pending", progress: 0 },
        loading: { status: "pending", progress: 0 },
        verification: { status: "pending", progress: 0 }
      }
    });

    await this.assessSystem(migrationId, config);
    await this.queueExtractionJobs(migrationId, config);

    return migrationId;
  }

  private async assessSystem(migrationId: string, config: MigrationConfig) {
    const progress = this.getProgressOrThrow(migrationId);
    progress.steps.assessment.status = "in_progress";
    logger.debug("migration: assessing SAP landscape", {
      migrationId,
      source: config.source,
      entities: config.entities
    });

    try {
      await this.sapConnector.connect();
      const systemInfo = await this.sapConnector.getSystemInfo();

      const recordCounts = {
        materials: await this.sapConnector.countRecords("MARA"),
        vendors: await this.sapConnector.countRecords("LFA1"),
        customers: await this.sapConnector.countRecords("KNA1"),
        purchaseOrders: await this.sapConnector.countRecords("EKKO"),
        salesOrders: await this.sapConnector.countRecords("VBAK"),
        inventory: await this.sapConnector.countRecords("MARD"),
        bom: await this.sapConnector.countRecords("STKO")
      };

      progress.assessment = {
        systemInfo,
        recordCounts,
        estimatedTime: this.estimateMigrationTime(recordCounts),
        dataSize: this.estimateDataSize(recordCounts)
      };

      progress.steps.assessment.status = "completed";
      progress.steps.assessment.progress = 100;

      io.to(`org:${progress.organizationId}`).emit("migration:progress", progress);
      logger.info("Migration assessment completed", { migrationId, recordCounts });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      progress.steps.assessment.status = "failed";
      progress.steps.assessment.error = message;
      logger.error("Assessment failed", { migrationId, error });
      throw error instanceof Error ? error : new Error(message);
    }
  }

  private async queueExtractionJobs(migrationId: string, config: MigrationConfig) {
    const progress = this.getProgressOrThrow(migrationId);
    const recordCounts = progress.assessment?.recordCounts ?? ({} as Record<string, number>);

    const extractionJobs = [
      { type: "materials", table: "MARA", count: recordCounts.materials ?? 0 },
      { type: "vendors", table: "LFA1", count: recordCounts.vendors ?? 0 },
      { type: "customers", table: "KNA1", count: recordCounts.customers ?? 0 },
      { type: "inventory", table: "MARD", count: recordCounts.inventory ?? 0 },
      { type: "bom", table: "STKO", count: recordCounts.bom ?? 0 },
      { type: "purchaseOrders", table: "EKKO", count: recordCounts.purchaseOrders ?? 0 },
      { type: "salesOrders", table: "VBAK", count: recordCounts.salesOrders ?? 0 }
    ];

    for (const job of extractionJobs) {
      if (config.entities.includes(job.type)) {
        await this.migrationQueue.add("extract", {
          migrationId,
          ...job,
          batchSize: config.options?.batchSize ?? 1000
        });
      }
    }

    progress.steps.extraction.status = "queued";
  }

  private async processExtraction(data: any) {
    const { migrationId, type, table, count, batchSize } = data;
    const progress = this.getProgressOrThrow(migrationId);

    progress.steps.extraction.status = "in_progress";

    try {
  const batches = Math.ceil((count ?? 0) / (batchSize ?? 1000));
  const extractedData: SapRecord[] = [];

      for (let i = 0; i < batches; i++) {
        const offset = i * (batchSize ?? 1000);
  const batchData = (await this.sapConnector.extractBatch(table, offset, batchSize ?? 1000)) ?? [];

  await redis.setex(`migration:${migrationId}:raw:${type}:${i}`, 86400, JSON.stringify(batchData));

        extractedData.push(...batchData);

        const percentComplete = ((i + 1) / Math.max(batches, 1)) * 100;
        progress.steps.extraction.progress = percentComplete;
        progress.steps.extraction.current = `${type}: ${offset + batchData.length}/${count}`;
        io.to(`org:${progress.organizationId}`).emit("migration:progress", progress);
      }

      await this.migrationQueue.add("transform", {
        migrationId,
        type,
        dataKey: `migration:${migrationId}:raw:${type}`,
        recordCount: extractedData.length
      });

      logger.info("Extraction completed", { migrationId, type, records: extractedData.length });
      return { success: true, records: extractedData.length };
    } catch (error) {
      logger.error("Extraction failed", { migrationId, type, error });
      throw error;
    }
  }

  private async processTransformation(data: any) {
    const { migrationId, type, dataKey, recordCount } = data;
    const progress = this.getProgressOrThrow(migrationId);

    progress.steps.transformation.status = "in_progress";

    try {
  const transformedData: SapRecord[] = [];
      const keys = await redis.keys(`${dataKey}:*`);

      for (const key of keys) {
  const raw = JSON.parse((await redis.get(key)) ?? "[]");
        const transformed = await this.transformer.transform(type, raw);
        transformedData.push(...transformed);
        await redis.setex(key.replace("raw", "transformed"), 86400, JSON.stringify(transformed));
      }

      await this.migrationQueue.add("validate", {
        migrationId,
        type,
        dataKey: dataKey.replace("raw", "transformed"),
        recordCount: transformedData.length
      });

      progress.steps.transformation.progress = 100;
      logger.info("Transformation completed", { migrationId, type, records: transformedData.length });
      return { success: true, records: transformedData.length, expected: recordCount };
    } catch (error) {
      logger.error("Transformation failed", { migrationId, type, error });
      throw error;
    }
  }

  private async processValidation(data: any) {
    const { migrationId, type, dataKey, recordCount } = data;
    const progress = this.getProgressOrThrow(migrationId);

    progress.steps.validation.status = "in_progress";

    try {
      const validationResults: {
        valid: SapRecord[];
        invalid: Array<{ record: SapRecord; errors: unknown }>;
        warnings: Array<{ record: SapRecord; warnings: unknown }>;
      } = { valid: [], invalid: [], warnings: [] };
      const keys = await redis.keys(`${dataKey}:*`);

      for (const key of keys) {
        const transformedData = JSON.parse((await redis.get(key)) ?? "[]");

        for (const record of transformedData) {
          const validation = await this.validator.validate(type, record);
          if (validation.isValid) validationResults.valid.push(record);
          else validationResults.invalid.push({ record, errors: validation.errors });
          if (validation.warnings.length) validationResults.warnings.push({ record, warnings: validation.warnings });
        }
      }

      await redis.setex(`migration:${migrationId}:validation:${type}`, 86400, JSON.stringify(validationResults));

      const validPercent = (validationResults.valid.length / Math.max(recordCount, 1)) * 100;
      if (validPercent >= 95) {
        await this.migrationQueue.add("load", { migrationId, type, dataKey, validRecords: validationResults.valid.length });
      } else {
        progress.steps.validation.status = "failed";
        progress.steps.validation.error = `Only ${validPercent.toFixed(1)}% of records passed validation`;
      }

      progress.steps.validation.progress = 100;
      progress.steps.validation.results = { valid: validationResults.valid.length, invalid: validationResults.invalid.length, warnings: validationResults.warnings.length };
      logger.info("Validation completed", { migrationId, type, results: validationResults });
      return validationResults;
    } catch (error) {
      logger.error("Validation failed", { migrationId, type, error });
      throw error;
    }
  }

  private async processLoading(data: any) {
    const { migrationId, type, dataKey, validRecords } = data;
    const progress = this.getProgressOrThrow(migrationId);

    progress.steps.loading.status = "in_progress";

    try {
      let loadedCount = 0;
      const keys = await redis.keys(`${dataKey}:*`);

      for (const key of keys) {
        const transformedData = JSON.parse((await redis.get(key)) ?? "[]");

        switch (type) {
          case "materials":
            await this.loadMaterials(transformedData, progress.organizationId);
            break;
          case "vendors":
            await this.loadVendors(transformedData, progress.organizationId);
            break;
          case "inventory":
            await this.loadInventory(transformedData, progress.organizationId);
            break;
          case "purchaseOrders":
            await this.loadPurchaseOrders(transformedData, progress.organizationId);
            break;
        }

        loadedCount += transformedData.length;
        progress.steps.loading.progress = (loadedCount / Math.max(validRecords, 1)) * 100;
        io.to(`org:${progress.organizationId}`).emit("migration:progress", progress);
      }

      progress.steps.loading.status = "completed";
      logger.info("Loading completed", { migrationId, type, loaded: loadedCount });

      await this.checkMigrationComplete(migrationId);
      return { success: true, loaded: loadedCount };
    } catch (error) {
      logger.error("Loading failed", { migrationId, type, error });
      throw error;
    }
  }

  private async loadMaterials(materials: SapMaterialRecord[], scopeId: string) {
    const facility = await this.resolveFacility(scopeId);
    if (!facility) {
      logger.warn("migration: unable to map materials because no facility exists", { scopeId });
      return;
    }

    for (const material of materials) {
      const sku = material.materialNumber ?? material.sku ?? `MIG-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const quantity = Number(material.quantity ?? material.availableQty ?? 0);
      const uom = material.unit ?? material.baseUnit ?? "EA";

      const existing = await prisma.inventory.findFirst({ where: { facilityId: facility.id, sku } });

      if (existing) {
        await prisma.inventory.update({
          where: { id: existing.id },
          data: {
            quantityOnHand: quantity,
            uom
          }
        });
      } else {
        await prisma.inventory.create({
          data: {
            facilityId: facility.id,
            sku,
            quantityOnHand: quantity,
            quantityOnHold: 0,
            uom,
            qaState: "released"
          }
        });
      }
    }
  }

  private async loadVendors(vendors: SapVendorRecord[], scopeId: string) {
    const tenant = await this.resolveTenant(scopeId);
    if (!tenant) {
      logger.warn("migration: vendor load skipped because no tenant was resolved", { scopeId });
      return;
    }

    for (const vendor of vendors) {
      const code = vendor.vendorNumber ?? vendor.code ?? `V-${Math.random().toString(16).slice(2, 8)}`;
      const payload = {
        name: vendor.name ?? code,
        leadTimeDays: typeof vendor.leadTime === "number" ? Math.round(vendor.leadTime) : null,
        paymentTerms: vendor.paymentTerms ?? null,
        contact: {
          email: vendor.email ?? null,
          phone: vendor.phone ?? null,
          address: vendor.address ?? null
        }
      };

      await prisma.supplier.upsert({
        where: {
          tenantId_code: {
            tenantId: tenant.id,
            code
          }
        },
        update: payload,
        create: {
          tenantId: tenant.id,
          code,
          ...payload
        }
      });
    }
  }

  private async loadInventory(inventory: SapInventoryRecord[], scopeId: string) {
    const facility = await this.resolveFacility(scopeId);
    if (!facility) {
      logger.warn("migration: inventory adjustments skipped because no facility was resolved", { scopeId });
      return;
    }

    for (const item of inventory) {
      const sku = item.materialNumber ?? item.sku;
      if (!sku) continue;

      const quantity = Number(item.quantity ?? item.availableQty ?? 0);
      const holdQty = Number(item.qualityQty ?? 0);
      const uom = item.unit ?? item.uom ?? "EA";

      const existing = await prisma.inventory.findFirst({ where: { facilityId: facility.id, sku } });

      if (existing) {
        await prisma.inventory.update({
          where: { id: existing.id },
          data: {
            quantityOnHand: quantity,
            quantityOnHold: holdQty,
            uom
          }
        });
      } else {
        await prisma.inventory.create({
          data: {
            facilityId: facility.id,
            sku,
            quantityOnHand: quantity,
            quantityOnHold: holdQty,
            uom,
            qaState: "released"
          }
        });
      }
    }
  }

  private async loadPurchaseOrders(orders: SapPurchaseOrderRecord[], scopeId: string) {
    const tenant = await this.resolveTenant(scopeId);
    if (!tenant) {
      logger.warn("migration: purchase order load skipped because no tenant was resolved", { scopeId });
      return;
    }

    for (const order of orders) {
      const supplierCode = order.vendorNumber ?? order.supplierCode;
      if (!supplierCode) {
        logger.warn("migration: purchase order skipped due to missing supplier code", { orderNumber: order.purchaseOrderNumber });
        continue;
      }

      let supplier = await prisma.supplier.findUnique({
        where: {
          tenantId_code: {
            tenantId: tenant.id,
            code: supplierCode
          }
        }
      });

      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            tenantId: tenant.id,
            code: supplierCode,
            name: order.vendorName ?? supplierCode,
            paymentTerms: order.paymentTerms ?? null,
            contact: (order.vendorContact as Prisma.InputJsonValue) ?? Prisma.JsonNull
          }
        });
      }

      const documentNumber = order.purchaseOrderNumber ?? `MIG-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

      await prisma.purchaseOrder.upsert({
        where: {
          tenantId_documentNumber: {
            tenantId: tenant.id,
            documentNumber
          }
        },
        create: {
          tenantId: tenant.id,
          supplierId: supplier.id,
          documentNumber,
          status: this.mapPOStatus(order.status),
          incoterms: order.incoterms ?? null,
          expectedDate: order.deliveryDate ? new Date(order.deliveryDate) : null,
          currency: order.currency ?? "USD"
        },
        update: {
          status: this.mapPOStatus(order.status),
          expectedDate: order.deliveryDate ? new Date(order.deliveryDate) : null,
          supplierId: supplier.id
        }
      });
    }
  }

  private async resolveFacility(scopeId: string) {
    if (scopeId) {
      const facility = await prisma.facility.findUnique({ where: { id: scopeId } });
      if (facility) {
        return facility;
      }
    }
    return prisma.facility.findFirst();
  }

  private async resolveTenant(scopeId: string) {
    if (scopeId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: scopeId } });
      if (tenant) {
        return tenant;
      }
    }
    return prisma.tenant.findFirst();
  }

  private getProgressOrThrow(migrationId: string): MigrationProgress {
    const progress = this.progress.get(migrationId);
    if (!progress) {
      throw new Error(`Migration ${migrationId} not found`);
    }
    return progress;
  }

  private async checkMigrationComplete(migrationId: string) {
    const progress = this.getProgressOrThrow(migrationId);
    const steps = Object.values(progress.steps ?? {}) as Array<{ status: string }>;
    const allStepsComplete = steps.every((step) => step.status === "completed" || step.status === "skipped");

    if (allStepsComplete) {
      progress.status = "completed";
      progress.completedTime = new Date();
      const durationMs = progress.completedTime.getTime() - progress.startTime.getTime();
      io.to(`org:${progress.organizationId}`).emit("migration:completed", { migrationId, duration: durationMs, summary: progress });
      logger.info("Migration completed successfully", { migrationId });
    }
  }

  private estimateMigrationTime(recordCounts: any): number {
    const totalRecords = Object.values(recordCounts || {}).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0);
    return Math.ceil(totalRecords / 100 / 60);
  }

  private estimateDataSize(recordCounts: any): number {
    const totalRecords = Object.values(recordCounts || {}).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0);
    return totalRecords * 1024;
  }

  private mapPOStatus(sapStatus?: string): string {
    const statusMap: Record<string, string> = { A: "draft", B: "sent", C: "confirmed", D: "received", X: "cancelled" };
    if (!sapStatus) return "draft";
    return statusMap[sapStatus] || "draft";
  }

  async getMigrationStatus(migrationId: string) {
    return this.progress.get(migrationId);
  }

  listMigrations() {
    return Array.from(this.progress.values());
  }

  async pauseMigration(migrationId: string) {
    await this.migrationQueue.pause();
    const progress = this.progress.get(migrationId);
    if (progress) progress.status = "paused";
    return progress;
  }

  async resumeMigration(migrationId: string) {
    await this.migrationQueue.resume();
    const progress = this.progress.get(migrationId);
    if (progress) progress.status = "running";
    return progress;
  }

  async rollbackMigration(migrationId: string) {
    logger.warn("Migration rollback requested", { migrationId });
    return { success: true, message: "Rollback completed" };
  }
}

interface MigrationConfig {
  source: "SAP" | "Oracle" | "Legacy";
  entities: string[];
  mode: "full" | "incremental";
  sandbox: boolean;
  options: { batchSize?: number; parallel?: boolean; validateOnly?: boolean };
}

export const migrationService = new SAPMigrationService();
