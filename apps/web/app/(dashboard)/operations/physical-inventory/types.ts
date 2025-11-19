import { z } from "zod";

export const countModeSchema = z.enum(["manual", "scanner", "mobile"]);
export type CountMode = z.infer<typeof countModeSchema>;

export const documentTypeSchema = z.enum(["cycle", "annual", "spot"]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const documentStatusSchema = z.enum(["created", "released", "counting", "recount", "posted"]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const binStatusSchema = z.enum(["pending", "counted", "recount"]);
export type BinStatus = z.infer<typeof binStatusSchema>;

export const countBinSchema = z.object({
  id: z.string(),
  bin: z.string(),
  material: z.string(),
  description: z.string(),
  batch: z.string().optional(),
  bookQty: z.number(),
  countQty: z.number().nullable(),
  unit: z.string(),
  variance: z.number().nullable(),
  status: binStatusSchema,
  countedBy: z.string().optional(),
  countedAt: z.string().optional(),
  requiresRecount: z.boolean().optional(),
  notes: z.string().optional(),
});
export type CountBin = z.infer<typeof countBinSchema>;

export const inventoryDocumentSchema = z.object({
  id: z.string(),
  number: z.string(),
  type: documentTypeSchema,
  status: documentStatusSchema,
  plant: z.string(),
  storageLocation: z.string(),
  controller: z.string(),
  accuracy: z.number(),
  varianceValue: z.number(),
  progress: z.number(),
  scheduledDate: z.string(),
  bins: z.array(countBinSchema),
});
export type InventoryDocument = z.infer<typeof inventoryDocumentSchema>;

export const waveTaskSchema = z.object({
  id: z.string(),
  label: z.string(),
  location: z.string(),
  bins: z.number(),
  owner: z.string(),
  eta: z.string(),
  status: z.enum(["precheck", "counting", "recount", "posted"]),
});
export type WaveTask = z.infer<typeof waveTaskSchema>;

export const varianceInsightSchema = z.object({
  reason: z.string(),
  count: z.number(),
  value: z.number(),
  severity: z.enum(["medium", "high", "low"]),
});
export type VarianceInsight = z.infer<typeof varianceInsightSchema>;

export const accuracyTrendSchema = z.object({
  month: z.string(),
  value: z.number(),
});
export type AccuracyTrend = z.infer<typeof accuracyTrendSchema>;

export const abcProgramSchema = z.object({
  bucket: z.enum(["A", "B", "C"]),
  volume: z.string(),
  frequency: z.string(),
  coverage: z.number(),
});
export type ABCProgram = z.infer<typeof abcProgramSchema>;

export const mobileTaskSchema = z.object({
  id: z.string(),
  bin: z.string(),
  material: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  instructions: z.string(),
});
export type MobileTask = z.infer<typeof mobileTaskSchema>;

export const inventoryPayloadSchema = z.object({
  documents: z.array(inventoryDocumentSchema),
  waveTasks: z.array(waveTaskSchema),
  varianceInsights: z.array(varianceInsightSchema),
  accuracyTrend: z.array(accuracyTrendSchema),
  abcPrograms: z.array(abcProgramSchema),
  mobileQueue: z.array(mobileTaskSchema),
});
export type InventoryPayload = z.infer<typeof inventoryPayloadSchema>;
