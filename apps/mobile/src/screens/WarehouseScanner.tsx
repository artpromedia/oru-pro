import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Location from "expo-location";

import { useWarehouseScanner } from "@/hooks/useWarehouseScanner";
import { OperationSelector } from "@/components/OperationSelector";
import { ScanResultCard } from "@/components/ScanResultCard";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { palette } from "@/theme/colors";

export function WarehouseScanner() {
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  const [isPermissionLoading, setIsPermissionLoading] = useState(true);

  const {
    operations,
    currentOperation,
    setCurrentOperation,
    isProcessing,
    handleBarCodeScanned,
    scannedResult,
    feedback,
    pendingQueue,
    isSyncingQueue,
    syncQueuedScans,
  } = useWarehouseScanner();

  const requestPermissions = useCallback(async () => {
    setIsPermissionLoading(true);
    try {
      const camera = await BarCodeScanner.requestPermissionsAsync();
      setCameraPermissionStatus(camera.status === "granted" ? "granted" : "denied");

      const location = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(location.status === "granted" ? "granted" : "denied");
    } catch (error) {
      console.error("Permission request failed", error);
      Alert.alert("Permissions", "Unable to request camera/location permissions. Please enable them in settings.");
      setCameraPermissionStatus("denied");
      setLocationPermissionStatus("denied");
    } finally {
      setIsPermissionLoading(false);
    }
  }, []);

  useEffect(() => {
    requestPermissions().catch(() => null);
  }, [requestPermissions]);

  if (isPermissionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.white} size="large" />
        <Text style={styles.helperText}>Preparing camera…</Text>
      </View>
    );
  }

  if (cameraPermissionStatus !== "granted") {
    return (
      <PermissionPrompt
        title="Camera access is required"
        description="Enable camera access to scan GS1, QR, or linear barcodes."
        actionLabel="Open Settings"
        onPress={() => Linking.openSettings()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={isProcessing ? undefined : handleBarCodeScanned}
        barCodeTypes={Object.values(BarCodeScanner.Constants.BarCodeType)}
      />

      <View style={styles.overlay}>
        <View style={[styles.header, { backgroundColor: operations[currentOperation].color }]}
          accessibilityRole="header"
        >
          <Text style={styles.operationTitle}>{operations[currentOperation].title}</Text>
          <Text style={styles.operationSubtitle}>{operations[currentOperation].description}</Text>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>{isProcessing ? "Processing scan…" : "Align barcode within the frame"}</Text>
          {locationPermissionStatus !== "granted" && (
            <Text style={styles.helperText}>Location is optional but improves traceability.</Text>
          )}
        </View>

        <ScanResultCard result={scannedResult} />

        {pendingQueue > 0 && (
          <View style={styles.queueBanner} accessibilityRole="alert">
            <Text style={styles.queueText}>
              {pendingQueue} scan{pendingQueue === 1 ? "" : "s"} waiting for sync
            </Text>
            <TouchableOpacity
              style={[styles.queueButton, isSyncingQueue && { opacity: 0.6 }]}
              onPress={syncQueuedScans}
              disabled={isSyncingQueue}
            >
              <Text style={styles.queueButtonLabel}>{isSyncingQueue ? "Syncing…" : "Sync now"}</Text>
            </TouchableOpacity>
          </View>
        )}

        <OperationSelector
          operations={operations}
          currentOperation={currentOperation}
          onChange={setCurrentOperation}
        />
      </View>

      <FeedbackBanner feedback={feedback} />
    </View>
  );
}

type PermissionPromptProps = {
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
};

function PermissionPrompt({ title, description, actionLabel, onPress }: PermissionPromptProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.permissionTitle}>{title}</Text>
      <Text style={styles.permissionBody}>{description}</Text>
      <TouchableOpacity style={styles.permissionButton} onPress={onPress}>
        <Text style={styles.permissionButtonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate900,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 32,
  },
  header: {
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.85)",
  },
  operationTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: "700",
  },
  operationSubtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontSize: 14,
  },
  scanArea: {
    alignItems: "center",
    rowGap: 16,
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  scanHint: {
    color: palette.white,
    fontSize: 16,
  },
  helperText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  queueBanner: {
    backgroundColor: "rgba(15,23,42,0.85)",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
  },
  queueText: {
    color: palette.white,
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  queueButton: {
    backgroundColor: palette.info,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  queueButtonLabel: {
    color: palette.white,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    backgroundColor: palette.slate900,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionTitle: {
    color: palette.white,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  permissionBody: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    textAlign: "center",
    marginVertical: 12,
  },
  permissionButton: {
    backgroundColor: palette.info,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  permissionButtonText: {
    color: palette.white,
    fontWeight: "600",
  },
});
