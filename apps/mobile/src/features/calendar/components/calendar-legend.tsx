import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

const ITEMS = [
  { label: "Period", color: colors.primary },
  { label: "Fertile", color: colors.primarySoft },
  { label: "Ovulation", color: colors.info },
];

export function CalendarLegend() {
  return (
    <View style={styles.row}>
      {ITEMS.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14 },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkMuted },
});
