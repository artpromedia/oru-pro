import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "@/theme/colors";

export type ScanResult = {
  material?: string;
  quantity?: string | number;
  location?: string;
  batch?: string;
  lot?: string;
  expiry?: string;
};

type Props = {
  result: ScanResult | null;
};

export const ScanResultCard = memo(({ result }: Props) => {
  if (!result) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{result.material ?? "Scanned Item"}</Text>
      <View style={styles.row}>
        {result.quantity && <Text style={styles.meta}>Qty: {result.quantity}</Text>}
        {result.location && <Text style={styles.meta}>Bin: {result.location}</Text>}
      </View>
      <View style={styles.row}>
        {result.batch && <Text style={styles.meta}>Batch: {result.batch}</Text>}
        {result.expiry && <Text style={styles.meta}>Exp: {result.expiry}</Text>}
      </View>
      {result.lot && <Text style={styles.meta}>Lot: {result.lot}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: palette.slate900,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.slate900,
  },
  row: {
    flexDirection: "row",
    columnGap: 12,
    marginTop: 8,
  },
  meta: {
    fontSize: 14,
    color: palette.slate700,
  },
});
