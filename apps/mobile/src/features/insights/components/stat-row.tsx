import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { InsightsData } from "../types";

/** The three headline numbers: average cycle, average period, regularity. */
export function StatRow({ stats }: { stats: InsightsData["stats"] }) {
  const items = [
    { label: "Avg cycle", value: stats.avgCycleDays != null ? `${stats.avgCycleDays}d` : "–" },
    { label: "Avg period", value: stats.avgPeriodDays != null ? `${stats.avgPeriodDays}d` : "–" },
    { label: "Regularity", value: stats.regularityPercent != null ? `${stats.regularityPercent}%` : "–" },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.card}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  value: { fontFamily: fonts.bold, fontSize: 19, color: colors.primary },
  label: { textAlign: "center", fontFamily: fonts.semibold, fontSize: 11, color: colors.inkMuted },
});
