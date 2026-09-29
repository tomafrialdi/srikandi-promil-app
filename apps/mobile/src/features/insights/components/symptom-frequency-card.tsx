import { StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/charts/progress-bar";
import { colors, fonts } from "@/constants/theme";
import type { SymptomFrequency } from "../types";

export function SymptomFrequencyCard({ symptoms }: { symptoms: SymptomFrequency[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Most logged symptoms</Text>
      {symptoms.map((s) => (
        <View key={s.id} style={styles.item}>
          <View style={styles.labels}>
            <Text style={styles.label}>{s.label}</Text>
            <Text style={styles.percent}>{s.percent}%</Text>
          </View>
          <ProgressBar value={s.percent / 100} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  item: { gap: 6 },
  labels: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  percent: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
});
