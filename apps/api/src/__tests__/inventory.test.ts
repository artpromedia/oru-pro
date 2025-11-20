import express from "express";
import request from "supertest";

const prismaMock = {
	$connect: jest.fn(),
	$disconnect: jest.fn(),
		$transaction: jest.fn(async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => cb(prismaMock)),
	plant: {
		findFirst: jest.fn()
	},
	tenant: {
		findUnique: jest.fn()
	},
	material: {
		findFirst: jest.fn()
	},
	materialStock: {
		findMany: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn()
	},
	inventoryAlert: {
		findMany: jest.fn()
	},
	auditLog: {
		create: jest.fn()
	},
	inventory: {
		deleteMany: jest.fn(),
		create: jest.fn(),
		findFirst: jest.fn()
	},
	materialBatch: {
		upsert: jest.fn()
	},
	storageLocation: {
		findFirst: jest.fn()
	},
	materialDocument: {
		create: jest.fn()
	},
	materialMovement: {
		create: jest.fn()
	},
	qualityLot: {
		create: jest.fn()
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as Record<string, any>;

jest.mock("@oru/database", () => ({
	prisma: prismaMock
}));

const inventoryQueueMock = {
	add: jest.fn()
};

jest.mock("../jobs/queues.js", () => ({
	inventoryQueue: inventoryQueueMock
}));

const aiAgentMock = {
	generateInsight: jest.fn(),
	forecastDemand: jest.fn()
};

jest.mock("../lib/ai/index.js", () => ({
	aiAgent: aiAgentMock
}));

const redisState = new Map<string, string>();
const redisMock = {
	on: jest.fn(),
	keys: jest.fn(async () => Array.from(redisState.keys())),
	del: jest.fn(async (...keys: string[]) => {
		keys.forEach((key) => redisState.delete(key));
		return keys.length;
	}),
	get: jest.fn(async (key: string) => redisState.get(key) ?? null),
	set: jest.fn(async (key: string, value: string) => {
		redisState.set(key, value);
		return "OK";
	}),
	setex: jest.fn(async (key: string, _ttl: number, value: string) => {
		redisState.set(key, value);
		return "OK";
	})
};

jest.mock("ioredis", () => ({
	Redis: jest.fn(() => redisMock)
}));

// Import after mocks are set up
import { inventoryRoutes } from "../routes/inventory.js";

const buildApp = () => {
	const app = express();
	app.use(express.json());
	app.use("/api/inventory", inventoryRoutes);
	return app;
};

describe("Inventory routes", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		redisState.clear();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("returns aggregated stock overview payload", async () => {
		const tenantId = "tenant-123";
		prismaMock.materialStock.findMany.mockResolvedValueOnce([
			{
				tenantId,
				material: { materialNumber: "MAT-001", description: "Widget" },
				plant: { code: "PLANT-01", name: "Plant 01" },
				storageLocation: { code: "FG01" },
				batch: { batchNumber: "BATCH-01" },
				availableQty: 500,
				qualityQty: 25,
				blockedQty: 0,
				reorderPoint: 100,
				safetyStock: 50,
				status: "released",
				agingBucket: "0-30",
				uom: "EA",
				updatedAt: new Date()
			}
		]);

		prismaMock.inventoryAlert.findMany.mockResolvedValueOnce([]);
		aiAgentMock.generateInsight.mockResolvedValueOnce({
			summary: "All good",
			riskLevel: "low"
		});

		const response = await request(buildApp())
			.get(`/api/inventory/mb52?tenantId=${tenantId}`)
			.expect(200);

		expect(response.body.data).toHaveLength(1);
		expect(response.body.aggregates.total.available).toBe(500);
		expect(aiAgentMock.generateInsight).toHaveBeenCalled();
		expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					tenantId,
					action: "MB52_VIEW"
				})
			})
		);
	});

	it("serves cached stock overview responses", async () => {
		const tenantId = "tenant-cache";
		const cachedPayload = { data: [{ tenantId }], aggregates: { total: {} } };
		redisState.set(`inventory:mb52:${tenantId}:all:all:true`, JSON.stringify(cachedPayload));
		redisMock.get.mockResolvedValueOnce(JSON.stringify(cachedPayload));

		const response = await request(buildApp())
			.get(`/api/inventory/mb52?tenantId=${tenantId}`)
			.expect(200);

		expect(response.body).toEqual(cachedPayload);
		expect(prismaMock.materialStock.findMany).not.toHaveBeenCalled();
	});

	it("rejects goods movement when tenant is missing", async () => {
		prismaMock.tenant.findUnique.mockResolvedValueOnce(null);

		const response = await request(buildApp())
			.post("/api/inventory/migo")
			.send({
				tenantId: "missing",
				movementType: "101",
				materialNumber: "MAT-001",
				quantity: 10,
				uom: "EA",
				plantCode: "PLANT-01",
				requestedBy: "tester"
			})
			.expect(404);

		expect(response.body.message).toMatch(/Tenant not found/i);
	});

	it("prevents movement when plant lookup fails", async () => {
		prismaMock.tenant.findUnique.mockResolvedValueOnce({ id: "tenant" });
		prismaMock.material.findFirst.mockResolvedValueOnce({ id: "mat1" });
		prismaMock.plant.findFirst.mockResolvedValueOnce(null);

		const response = await request(buildApp())
			.post("/api/inventory/migo")
			.send({
				tenantId: "tenant",
				movementType: "101",
				materialNumber: "MAT-001",
				quantity: 10,
				uom: "EA",
				plantCode: "PLANT-XX",
				requestedBy: "tester"
			})
			.expect(404);

		expect(response.body.message).toMatch(/Plant not found/i);
	});
});
