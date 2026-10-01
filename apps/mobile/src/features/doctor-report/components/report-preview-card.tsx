import { Flag } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import type { ReportPreview } from "../types";
import { BbtChart } from "./bbt-chart";

/** The "page" the doctor will see: patient, key figures, BBT chart and points to discuss. */
export function ReportPreviewCard({ preview }: { preview: ReportPreview }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.who}>
          <Text style={styles.name}>
            {preview.ageYears != null ? `${preview.name}, ${preview.ageYears}` : preview.name}
          </Text>
          <Text style={styles.range}>{preview.rangeLabel}</Text>
        </View>
        <View style={styles.pdfTag}>
          <Text style={styles.pdfText}>PDF</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        {preview.stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {preview.bbt ? (
        <BbtChart bbt={preview.bbt} />
      ) : (
        <View style={styles.noBbt}>
          <Text style={styles.noBbtText}>Temperature charts will appear here once you log your BBT.</Text>
        </View>
      )}

      {preview.flag ? (
        <View style={styles.flag}>
          <Flag size={14} color={colors.inkMuted} />
          <Text style={styles.flagText}>{preview.flag}</Text>
        </View>
      ) : null}
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
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  who: { gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  range: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  pdfTag: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, backgroundColor: colors.errorSoft },
  pdfText: { fontFamily: fonts.extrabold, fontSize: 10, color: colors.error },
  divider: { height: 1, backgroundColor: colors.border },
  stats: { flexDirection: "row", flexWrap: "wrap", rowGap: 12 },
  stat: { width: "50%", gap: 2, paddingRight: 12 },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
  statValue: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  noBbt: { padding: 14, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  noBbtText: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, color: colors.inkMuted },
  flag: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  flagText: { flex: 1, fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16, color: colors.inkMuted },
});
