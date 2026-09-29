import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current ? styles.active : styles.inactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 100 },
  active: { width: 24, backgroundColor: colors.primary },
  inactive: { width: 8, backgroundColor: colors.border },
});
