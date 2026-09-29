import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/constants/theme";

/** Horizontal progress track. `value` is 0..1. */
export function ProgressBar({ value, color = colors.primary }: { value: number; color?: string }) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, overflow: "hidden", borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  fill: { height: 8, borderRadius: radius.pill },
});
