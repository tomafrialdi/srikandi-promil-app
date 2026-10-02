import { StyleSheet, Text, View } from "react-native";

import { BarChart } from "@/components/charts/bar-chart";
import { colors, fonts } from "@/constants/theme";
import { MONTH_NAMES } from "@/utils/calendar";
import type { CycleTrendPoint } from "../types";

/** Bars fill the chart at this many days; longer cycles grow the axis. */
const MIN_AXIS_DAYS = 35;

export function CycleTrendCard({ trend }: { trend: CycleTrendPoint[] }) {
  const axisMax = Math.max(MIN_AXIS_DAYS, ...trend.map((p) => p.days));

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Cycle length trend</Text>
        <Text style={styles.unit}>days</Text>
      </View>
      {trend.length === 0 ? (
        <Text style={styles.empty}>Your cycle lengths will appear here after your first full cycle.</Text>
      ) : null}
      {trend.length > 0 ? (
        <BarChart
          axisMax={axisMax}
          items={trend.map((p, i) => ({
            key: p.month,
            label: MONTH_NAMES[Number(p.month.slice(5)) - 1].slice(0, 3),
            value: p.days,
            highlighted: i === trend.length - 1,
          }))}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  empty: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
  unit: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkFaint },
});
