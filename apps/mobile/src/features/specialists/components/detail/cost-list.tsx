import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts } from "@/constants/theme";
import type { SpecialistDetail } from "../../types";

export function CostList({ costs, note }: { costs: SpecialistDetail["costs"]; note: string }) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Estimated costs" />
      <View style={styles.card}>
        {costs.map((cost, i) => (
          <View key={cost.label} style={[styles.row, i < costs.length - 1 && styles.rowDivider]}>
            <View style={styles.label}>
              <Text style={styles.labelText}>{cost.label}</Text>
              {cost.badge ? <Chip label={cost.badge} tone="success" size="md" /> : null}
            </View>
            <Text style={styles.value}>{cost.value}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  card: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  labelText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  value: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  note: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
});
