import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ParsedBarcode } from "./barcode";
import type { Coordinates } from "./location";

const STORAGE_KEY = "oru.scanner.queue";

export type ScanPayload = {
  operation: string;
  barcode: string;
  parsedData: ParsedBarcode;
  location: Coordinates | null;
  timestamp: string;
  symbology: string;
};

export type QueuedScan = {
  id: string;
  payload: ScanPayload;
  attempts: number;
  lastError?: string;
};

export type FlushResult = {
  remaining: QueuedScan[];
  successes: number;
  failures: number;
  errors: string[];
};

async function readQueue(): Promise<QueuedScan[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedScan[];
  } catch (error) {
    console.warn("Unable to read scan queue", error);
    return [];
  }
}

async function writeQueue(queue: QueuedScan[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn("Unable to persist scan queue", error);
  }
}

function createQueueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getQueuedScans(): Promise<QueuedScan[]> {
  return readQueue();
}

export async function enqueueScan(payload: ScanPayload, lastError?: string): Promise<QueuedScan[]> {
  const queue = await readQueue();
  const entry: QueuedScan = {
    id: createQueueId(),
    payload,
    attempts: 0,
    lastError,
  };
  queue.push(entry);
  await writeQueue(queue);
  return queue;
}

export async function clearQueue(): Promise<void> {
  await writeQueue([]);
}

export async function flushQueuedScans(sender: (payload: ScanPayload) => Promise<unknown>): Promise<FlushResult> {
  const queue = await readQueue();
  if (queue.length === 0) {
    return { remaining: [], successes: 0, failures: 0, errors: [] };
  }

  const remaining: QueuedScan[] = [];
  const errors: string[] = [];

  for (const entry of queue) {
    try {
      await sender(entry.payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      errors.push(message);
      remaining.push({
        ...entry,
        attempts: entry.attempts + 1,
        lastError: message,
      });
    }
  }

  await writeQueue(remaining);
  return {
    remaining,
    successes: queue.length - remaining.length,
    failures: remaining.length,
    errors,
  };
}
