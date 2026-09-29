import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { colors, fonts, radius } from "@/constants/theme";
import type { TreatmentProgram } from "../types";

/** Current protocol: title, doctor, day, and a segmented progress bar over the stages. */
export function ProgramCard({ program }: { program: TreatmentProgram }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.info}>
          <Text style={styles.title}>{program.title}</Text>
          <Text style={styles.subtitle}>{program.subtitle}</Text>
        </View>
        <Chip label={program.dayLabel} tone="primary" />
      </View>

      <View style={styles.stages}>
        {program.stages.map((stage, i) => {
          const reached = i <= program.currentStageIndex;
          return (
            <View key={stage.id} style={styles.stage}>
              <View style={[styles.bar, reached && styles.barReached]} />
              <Text style={[styles.label, reached && styles.labelReached]}>{stage.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  info: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  stages: { flexDirection: "row", gap: 6 },
  stage: { flex: 1, gap: 6 },
  bar: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  barReached: { backgroundColor: colors.primary },
  label: { fontFamily: fonts.bold, fontSize: 10, color: colors.inkFaint },
  labelReached: { color: colors.primary },
});
