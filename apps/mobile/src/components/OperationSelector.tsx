import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette } from "@/theme/colors";

export type OperationKey = "receiving" | "picking" | "counting" | "putaway";

export type OperationConfig = {
  title: string;
  color: string;
  action: string;
  description: string;
};

type Props = {
  operations: Record<OperationKey, OperationConfig>;
  currentOperation: OperationKey;
  onChange: (key: OperationKey) => void;
};

export const OperationSelector = memo(({ operations, currentOperation, onChange }: Props) => {
  return (
    <View style={styles.container}>
      {Object.entries(operations).map(([key, operation]) => {
        const typedKey = key as OperationKey;
        const active = currentOperation === typedKey;
        return (
          <TouchableOpacity
            key={typedKey}
            style={[styles.button, active && { backgroundColor: "rgba(255,255,255,0.14)" }]}
            onPress={() => onChange(typedKey)}
          >
            <Text style={styles.title}>{operation.title}</Text>
            <Text style={styles.description}>{operation.description}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    columnGap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  title: {
    color: palette.white,
    fontWeight: "600",
    fontSize: 14,
  },
  description: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 2,
  },
});
