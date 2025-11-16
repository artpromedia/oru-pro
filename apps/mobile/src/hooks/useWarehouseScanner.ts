import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Vibration } from "react-native";
import { BarCodeScannerResult } from "expo-barcode-scanner";
import * as Haptics from "expo-haptics";

import { parseBarcode, type ParsedBarcode } from "@/utils/barcode";
import { fetchCurrentLocation } from "@/utils/location";
import { getAuthToken } from "@/utils/token";
import { playErrorTone, playSuccessTone } from "@/utils/audio";
import { API_BASE_URL, DEFAULT_OPERATION } from "@/utils/env";
import { enqueueScan, flushQueuedScans, getQueuedScans, type ScanPayload } from "@/utils/queue";

import type { OperationConfig, OperationKey } from "@/components/OperationSelector";
import type { ScanResult } from "@/components/ScanResultCard";
import type { Feedback } from "@/components/FeedbackBanner";

type ScanResponseData = {
  material?: string;
  quantity?: number | string;
  qty?: number | string;
  location?: string;
  batch?: string;
  batchId?: string;
  lot?: string;
  lotNumber?: string;
  expiry?: string;
};

type ScanResponse = {
  success?: boolean;
  message?: string;
  data?: ScanResponseData;
};

export type ScannerState = {
  operations: Record<OperationKey, OperationConfig>;
  currentOperation: OperationKey;
  setCurrentOperation: (op: OperationKey) => void;
  isProcessing: boolean;
  scannedResult: ScanResult | null;
  feedback: Feedback | null;
  pendingQueue: number;
  isSyncingQueue: boolean;
  syncQueuedScans: () => Promise<void>;
  handleBarCodeScanned: (result: BarCodeScannerResult) => Promise<void>;
};

const operations: Record<OperationKey, OperationConfig> = {
  receiving: {
    title: "Goods Receipt",
    color: "#10b981",
    action: "RECEIVE",
    description: "Dock + ASN validation",
  },
  picking: {
    title: "Order Picking",
    color: "#3b82f6",
    action: "PICK",
    description: "Wave orchestration",
  },
  counting: {
    title: "Cycle Count",
    color: "#f59e0b",
    action: "COUNT",
    description: "ABC sampling",
  },
  putaway: {
    title: "Put Away",
    color: "#8b5cf6",
    action: "PUTAWAY",
    description: "Bin suggestions",
  },
};

class ScanSyncError extends Error {
  shouldQueue: boolean;

  constructor(message: string, shouldQueue: boolean) {
    super(message);
    this.name = "ScanSyncError";
    this.shouldQueue = shouldQueue;
  }
}

async function triggerHaptics() {
  if (Platform.OS === "ios") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return;
  }

  Vibration.vibrate(120);
}

export function useWarehouseScanner(): ScannerState {
  const [currentOperation, setCurrentOperation] = useState<OperationKey>(DEFAULT_OPERATION);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [scannedResult, setScannedResult] = useState<ScanResult | null>(null);
  const [pendingQueue, setPendingQueue] = useState(0);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const operationLookup = useMemo(() => operations, []);

  const showFeedback = useCallback((next: Feedback | null) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    setFeedback(next);
    if (next) {
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
        feedbackTimeoutRef.current = null;
      }, 4500);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const refreshQueueCount = useCallback(async () => {
    const queue = await getQueuedScans();
    setPendingQueue(queue.length);
  }, []);

  useEffect(() => {
    refreshQueueCount().catch(() => null);
  }, [refreshQueueCount]);

  const transmitPayload = useCallback(async (payload: ScanPayload): Promise<ScanResponse> => {
    const token = await getAuthToken();
    if (!token) {
      throw new ScanSyncError("Missing auth token. Sign in via SecureStore or env", false);
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/warehouse/scan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network request failed";
      throw new ScanSyncError(message, true);
    }

  let json: ScanResponse | null = null;
    try {
      json = await response.json();
    } catch {
      // Ignore JSON parse errors for empty bodies
    }

    const success = response.ok && json?.success;
    if (!success) {
      const message = json?.message ?? "Unable to sync scan";
      const shouldQueue = response.status >= 500 || response.status === 0;
      throw new ScanSyncError(message, shouldQueue);
    }

    if (!json) {
      throw new ScanSyncError("Empty server response", false);
    }

    return json;
  }, []);

  const handleBarCodeScanned = useCallback(
    async ({ data, type }: BarCodeScannerResult) => {
      if (isProcessing) return;
      setIsProcessing(true);
      await triggerHaptics();

      const parsed = parseBarcode(data);
      const location = await fetchCurrentLocation();
      const payload: ScanPayload = {
        operation: operationLookup[currentOperation].action,
        barcode: data,
        parsedData: parsed,
        location,
        timestamp: new Date().toISOString(),
        symbology: type,
      };
      try {
        const json = await transmitPayload(payload);

        const parsedGs1 = parsed.type === "GS1-128" ? parsed : undefined;
        const normalized: ScanResult = {
          material: json.data?.material ?? parsedMaterial(parsed),
          quantity: json.data?.quantity ?? json.data?.qty,
          location: json.data?.location ?? locationToLabel(location),
          batch: json.data?.batch ?? json.data?.batchId,
          lot: json.data?.lot ?? json.data?.lotNumber ?? parsedGs1?.lot,
          expiry: json.data?.expiry ?? parsedGs1?.expiry,
        };

        setScannedResult(normalized);
        showFeedback({
          type: "success",
          title: `${operationLookup[currentOperation].title} captured`,
          message: json.message ?? "Record synced with Oru",
        });
        await playSuccessTone();
      } catch (error) {
        console.error("Scan failure", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        const shouldQueue = error instanceof ScanSyncError ? error.shouldQueue : true;
        if (shouldQueue) {
          const queue = await enqueueScan(payload, message);
          setPendingQueue(queue.length);
          showFeedback({
            type: "info",
            title: "Saved for later sync",
            message,
          });
        } else {
          showFeedback({
            type: "error",
            title: "Scan Failed",
            message,
          });
        }
        await playErrorTone();
      } finally {
        setTimeout(() => setIsProcessing(false), 1500);
      }
    },
    [currentOperation, isProcessing, operationLookup, showFeedback, transmitPayload],
  );

  const syncQueuedScans = useCallback(async () => {
    if (isSyncingQueue) return;
    setIsSyncingQueue(true);
    try {
      const result = await flushQueuedScans(transmitPayload);
      setPendingQueue(result.remaining.length);

      let feedbackToShow: Feedback | null = null;
      if (result.failures > 0) {
        feedbackToShow = {
          type: "error",
          title: "Some scans still pending",
          message: result.errors.at(-1) ?? "Retry when connection stabilizes.",
        };
      } else if (result.successes > 0) {
        feedbackToShow = {
          type: "success",
          title: "Offline scans synced",
          message: `${result.successes} scans sent to Oru`,
        };
      } else {
        feedbackToShow = {
          type: "info",
          title: "Queue empty",
          message: "No saved scans needed syncing",
        };
      }

      showFeedback(feedbackToShow);

      if (result.failures > 0) {
        await playErrorTone();
      } else if (result.successes > 0) {
        await playSuccessTone();
      }
    } catch (error) {
      console.error("Queue sync failure", error);
      showFeedback({
        type: "error",
        title: "Unable to sync queue",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      await playErrorTone();
    } finally {
      setIsSyncingQueue(false);
    }
  }, [isSyncingQueue, showFeedback, transmitPayload]);

  return {
    operations: operationLookup,
    currentOperation,
    setCurrentOperation,
    isProcessing,
    scannedResult,
    feedback,
    pendingQueue,
    isSyncingQueue,
    syncQueuedScans,
    handleBarCodeScanned,
  };
}

function parsedMaterial(parsed: ParsedBarcode): string | undefined {
  if (parsed.type === "GS1-128" && parsed.gtin) {
    return `GTIN ${parsed.gtin}`;
  }
  if (parsed.type === "QR" && typeof parsed.description === "string") {
    return parsed.description;
  }
  if (parsed.type === "PLAIN") {
    return parsed.value;
  }
  return undefined;
}

type Coordinates = Awaited<ReturnType<typeof fetchCurrentLocation>>;

function locationToLabel(location: Coordinates): string | undefined {
  if (!location) return undefined;
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}
