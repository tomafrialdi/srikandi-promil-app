import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

export interface BarChartItem {
  key: string;
  label: string;
  value: number;
  /** Solid bar with the value shown on top (e.g. the current period). */
  highlighted?: boolean;
}

interface BarChartProps {
  items: BarChartItem[];
  /** Value that would fill the whole bar area. Bars grow past it only up to the chart height. */
  axisMax: number;
  height?: number;
}

const LABEL_HEIGHT = 14;
const LABEL_GAP = 6;
const VALUE_BLOCK = 17; // highlighted value text + gap

/** Simple vertical bar chart: one column per item, label underneath. */
export function BarChart({ items, axisMax, height = 130 }: BarChartProps) {
  const barArea = height - LABEL_HEIGHT - LABEL_GAP;

  return (
    <View style={[styles.row, { height }]}>
      {items.map((item) => {
        const raw = (item.value / axisMax) * barArea;
        const barHeight = Math.round(Math.min(raw, item.highlighted ? barArea - VALUE_BLOCK : barArea));
        return (
          <View key={item.key} style={styles.column}>
            {item.highlighted ? <Text style={styles.value}>{item.value}</Text> : null}
            <View
              style={[
                styles.bar,
                { height: barHeight, backgroundColor: item.highlighted ? colors.primary : colors.primarySoft },
              ]}
            />
            <Text style={[styles.label, item.highlighted && styles.labelHighlighted]}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  column: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: LABEL_GAP },
  bar: { alignSelf: "stretch", borderRadius: 6 },
  value: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  label: { fontFamily: fonts.medium, fontSize: 10, color: colors.inkFaint },
  labelHighlighted: { fontFamily: fonts.bold, color: colors.ink },
});
