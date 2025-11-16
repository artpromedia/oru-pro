import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "@/theme/colors";

export type Feedback = {
  type: "success" | "error" | "info";
  title: string;
  message: string;
};

type Props = {
  feedback: Feedback | null;
};

export const FeedbackBanner = memo(({ feedback }: Props) => {
  if (!feedback) return null;

  const backgroundColor =
    feedback.type === "success"
      ? "rgba(16, 185, 129, 0.9)"
      : feedback.type === "error"
        ? "rgba(239, 68, 68, 0.9)"
        : "rgba(59, 130, 246, 0.9)";

  return (
    <View style={[styles.container, { backgroundColor }]}
      accessibilityRole="alert"
    >
      <Text style={styles.title}>{feedback.title}</Text>
      <Text style={styles.message}>{feedback.message}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 12,
    shadowColor: palette.slate900,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 16,
  },
  message: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 4,
  },
});
