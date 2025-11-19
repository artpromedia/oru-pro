import { promises as fs } from "fs";
import path from "path";

import { marketplaceReviewSeeds } from "@/app/(dashboard)/forge/builder/marketplace-data";
import type { MarketplaceReview, RatingSummary } from "@/app/(dashboard)/forge/builder/types";

const dataDir = path.join(
  process.cwd(),
  "apps",
  "web",
  "app",
  "api",
  "forge",
  "marketplace",
  ".data"
);
const reviewFile = path.join(dataDir, "reviews.json");
const installationFile = path.join(dataDir, "installations.json");

const defaultReviewStore = structuredClone(marketplaceReviewSeeds);

interface ReviewStore {
  [appId: string]: MarketplaceReview[];
}

interface InstallationRecord {
  installationId: string;
  appId: string;
  workspaceId: string;
  environment: string;
  timestamp: string;
  requestedBy?: string;
  version?: string;
  deploymentUrl?: string;
}

async function ensureDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function writeJson(filePath: string, payload: unknown) {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDir();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const clone = structuredClone(fallback);
      await writeJson(filePath, clone);
      return clone;
    }
    throw error;
  }
}

async function getReviewStore(): Promise<ReviewStore> {
  return readJson<ReviewStore>(reviewFile, defaultReviewStore);
}

function calculateSummary(reviews: MarketplaceReview[]): RatingSummary {
  const distribution: RatingSummary["distribution"] = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };

  if (reviews.length === 0) {
    return { average: 0, total: 0, distribution };
  }

  const totalScore = reviews.reduce((sum, review) => {
    distribution[String(review.rating) as keyof RatingSummary["distribution"]] += 1;
    return sum + review.rating;
  }, 0);

  return {
    average: Math.round((totalScore / reviews.length) * 10) / 10,
    total: reviews.length,
    distribution,
  };
}

export async function fetchReviews(appId: string): Promise<MarketplaceReview[]> {
  const store = await getReviewStore();
  return store[appId] ?? [];
}

export async function appendReview(appId: string, review: MarketplaceReview) {
  const store = await getReviewStore();
  const updated = [review, ...(store[appId] ?? [])];
  store[appId] = updated;
  await writeJson(reviewFile, store);
  return updated;
}

export async function getReviewSummaries(): Promise<Record<string, RatingSummary>> {
  const store = await getReviewStore();
  return Object.fromEntries(
    Object.entries(store).map(([appId, reviews]) => [appId, calculateSummary(reviews)])
  );
}

export const summarizeReviews = calculateSummary;

async function readInstallations(): Promise<InstallationRecord[]> {
  return readJson<InstallationRecord[]>(installationFile, []);
}

export async function recordInstallation(record: InstallationRecord) {
  const existing = await readInstallations();
  existing.push(record);
  await writeJson(installationFile, existing);
}

export async function getInstallationTotals(): Promise<Record<string, number>> {
  const installs = await readInstallations();
  return installs.reduce<Record<string, number>>((acc, record) => {
    acc[record.appId] = (acc[record.appId] ?? 0) + 1;
    return acc;
  }, {});
}

export async function getInstallationCount(appId: string): Promise<number> {
  const totals = await getInstallationTotals();
  return totals[appId] ?? 0;
}

export type { InstallationRecord };
