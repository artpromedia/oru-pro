import { ChromaClient, type Collection } from "chromadb";
import * as tf from "@tensorflow/tfjs";
import { logger } from "../../logger.js";
import { FallbackLLMRouter, type ProviderConfig, type ChatMessage } from "./providers.js";

export type InventoryInsightRequest = {
  tenantId: string;
  materialNumber?: string;
  plantCode?: string;
  metrics: {
    available: number;
    quality: number;
    blocked: number;
    safetyStock?: number;
    reorderPoint?: number;
  };
  alerts?: string[];
  history?: number[];
};

export type ForecastResult = {
  horizonDays: number;
  historicalSeries: number[];
  mean: number[];
  lower: number[];
  upper: number[];
};

export type InventoryInsightResponse = {
  summary: string;
  risks: string[];
  recommendations: string[];
  forecast?: ForecastResult;
};

export type InventoryMemoryRecord = {
  id: string;
  tenantId: string;
  materialNumber?: string;
  plantCode?: string;
  content: string;
};

export type InventoryAIAgentOptions = ProviderConfig & {
  chromaUrl?: string;
};

export class InventoryAIAgent {
  private chroma?: ChromaClient;
  private collectionPromise?: Promise<Collection>;
  private readonly router: FallbackLLMRouter | null;

  constructor(options: InventoryAIAgentOptions) {
    this.router = new FallbackLLMRouter({
      openai: options.openai,
      anthropic: options.anthropic,
      gemini: options.gemini,
      llama: options.llama
    });
    if (options.chromaUrl) {
      this.chroma = new ChromaClient({ path: options.chromaUrl });
    }
  }

  async forecastDemand(history: number[], horizonDays = 7): Promise<ForecastResult> {
    if (!history.length) {
      return {
        horizonDays,
        historicalSeries: history,
        mean: Array(horizonDays).fill(0),
        lower: Array(horizonDays).fill(0),
        upper: Array(horizonDays).fill(0)
      };
    }

    const xs = tf.tensor1d(history.map((_, idx) => idx));
    const ys = tf.tensor1d(history);
    const xMean = xs.mean();
    const yMean = ys.mean();
    const numerator = tf.sum(xs.sub(xMean).mul(ys.sub(yMean))).arraySync() as number;
    const denominator = tf.sum(xs.sub(xMean).square()).arraySync() as number;
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = (yMean.arraySync() as number) - slope * (xMean.arraySync() as number);

    const variance = tf.mean(ys.sub(yMean).square()).arraySync() as number;
    const stdDev = Math.sqrt(Math.max(variance, 0));

    const mean: number[] = [];
    const lower: number[] = [];
    const upper: number[] = [];

    for (let i = 1; i <= horizonDays; i++) {
      const x = history.length - 1 + i;
      const prediction = Math.max(intercept + slope * x, 0);
      mean.push(prediction);
      lower.push(Math.max(prediction - stdDev, 0));
      upper.push(prediction + stdDev);
    }

    tf.dispose([xs, ys, xMean, yMean]);

    return {
      horizonDays,
      historicalSeries: history,
      mean,
      lower,
      upper
    };
  }

  async generateInsight(request: InventoryInsightRequest): Promise<InventoryInsightResponse> {
    const { metrics } = request;
    const forecast = request.history?.length ? await this.forecastDemand(request.history) : undefined;
    const fallbackSummary = `Available ${metrics.available.toFixed(1)} ${request.materialNumber ?? "units"} with ${metrics.quality.toFixed(
      1
    )} awaiting QA and ${metrics.blocked.toFixed(1)} blocked. Safety stock ${metrics.safetyStock ?? 0} / reorder ${
      metrics.reorderPoint ?? 0
    }.`;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are the Oonru inventory AI. Respond as JSON with keys summary, risks, recommendations. Keep responses concise."
      },
      {
        role: "user",
        content: JSON.stringify({
          tenantId: request.tenantId,
          materialNumber: request.materialNumber,
          plantCode: request.plantCode,
          metrics: request.metrics,
          alerts: request.alerts,
          forecast
        })
      }
    ];

    try {
      const llmResponse = await this.router?.generate(messages);
      if (!llmResponse) {
        throw new Error("No providers responded");
      }
      const parsed = JSON.parse(llmResponse) as Partial<InventoryInsightResponse>;
      return {
        summary: parsed.summary ?? fallbackSummary,
        risks: parsed.risks ?? this.deriveRisks(metrics, request.alerts),
        recommendations: parsed.recommendations ?? this.deriveRecommendations(metrics),
        forecast
      };
    } catch (error) {
      logger.warn("inventory-ai: llm summary failed", { error });
      return {
        summary: fallbackSummary,
        risks: this.deriveRisks(metrics, request.alerts),
        recommendations: this.deriveRecommendations(metrics),
        forecast
      };
    }
  }

  async recordMemories(records: InventoryMemoryRecord[]): Promise<void> {
    if (!records.length || !this.chroma) {
      return;
    }
    try {
      const collection = await this.getCollection();
      const ids = records.map((record) => record.id);
      const documents = records.map((record) => record.content);
      const metadatas = records.map((record) => ({
        tenantId: record.tenantId,
        materialNumber: record.materialNumber ?? "unknown",
        plantCode: record.plantCode ?? "n/a"
      }));
      const embeddings = documents.map((doc) => this.embedText(doc));
      await collection.upsert({ ids, documents, metadatas, embeddings });
    } catch (error) {
      logger.warn("inventory-ai: chroma upsert failed", { error });
    }
  }

  private deriveRisks(metrics: InventoryInsightRequest["metrics"], alerts?: string[]) {
    const risks: string[] = [];
    if (metrics.available < (metrics.reorderPoint ?? 0)) {
      risks.push("Projected stockout risk vs reorder point");
    }
    if (metrics.quality > metrics.available * 0.5) {
      risks.push("Large share of stock on QA hold");
    }
    if (metrics.blocked > 0) {
      risks.push("Blocked stock requires manual release");
    }
    if (alerts?.length) {
      risks.push(...alerts.slice(0, 3));
    }
    return risks;
  }

  private deriveRecommendations(metrics: InventoryInsightRequest["metrics"]) {
    const recs: string[] = [];
    if (metrics.available < (metrics.reorderPoint ?? 0)) {
      recs.push("Trigger replenishment or expedite purchase orders");
    }
    if (metrics.quality > 0) {
      recs.push("Prioritize QA inspections to recover held stock");
    }
    if (metrics.blocked > 0) {
      recs.push("Investigate blocked batches and update release workflow");
    }
    if (!recs.length) {
      recs.push("Inventory position stable; continue monitoring predictive signals");
    }
    return recs;
  }

  private async getCollection(): Promise<Collection> {
    if (!this.chroma) {
      throw new Error("Chroma client not configured");
    }
    if (!this.collectionPromise) {
      this.collectionPromise = this.chroma.getOrCreateCollection({ name: "inventory_memories" });
    }
    return this.collectionPromise;
  }

  private embedText(input: string): number[] {
    const dimension = 32;
    const vector = Array(dimension).fill(0);
    for (let i = 0; i < input.length; i++) {
      vector[i % dimension] += input.charCodeAt(i) / 255;
    }
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    return norm === 0 ? vector : vector.map((value) => value / norm);
  }
}
