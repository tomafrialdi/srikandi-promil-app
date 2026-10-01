import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { ReportPreview } from "../types";

const HEIGHT = 70;
/** Fixed axis: 36.0 °C is the bottom, 37.0 °C the top. */
const MIN_TEMP = 36;
const MAX_TEMP = 37;

/** One bar per cycle day: before ovulation tinted, ovulation day amber, after ovulation solid. */
export function BbtChart({ bbt }: { bbt: NonNullable<ReportPreview["bbt"]> }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>{bbt.title}</Text>
        {bbt.biphasic ? <Text style={styles.biphasic}>Biphasic ✓</Text> : null}
      </View>

      <View style={styles.bars}>
        {bbt.temps.map((temp, i) => {
          const day = i + 1;
          const ratio = Math.min(1, Math.max(0.1, (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)));
          const color =
            day === bbt.ovulationDay ? colors.warning : day > bbt.ovulationDay ? colors.primary : colors.primaryTintStrong;
          return <View key={day} style={[styles.bar, { height: Math.round(ratio * HEIGHT), backgroundColor: color }]} />;
        })}
      </View>

      <View style={styles.axis}>
        <Text style={styles.axisLabel}>CD1</Text>
        <Text style={styles.axisLabel}>Ovulation CD{bbt.ovulationDay}</Text>
        <Text style={styles.axisLabel}>CD{bbt.temps.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 11, color: colors.inkMuted },
  biphasic: { fontFamily: fonts.bold, fontSize: 11, color: colors.success },
  bars: { height: HEIGHT, flexDirection: "row", alignItems: "flex-end", gap: 3 },
  bar: { flex: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  axis: { flexDirection: "row", justifyContent: "space-between" },
  axisLabel: { fontFamily: fonts.semibold, fontSize: 10, color: colors.inkFaint },
});
