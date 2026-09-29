import { Info } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { SpecialistDetail } from "../../types";

export function BpjsCard({ bpjs }: { bpjs: NonNullable<SpecialistDetail["bpjs"]> }) {
  return (
    <View style={styles.card}>
      <Info size={16} color={colors.success} />
      <View style={styles.text}>
        <Text style={styles.title}>{bpjs.title}</Text>
        <Text style={styles.description}>{bpjs.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.successSoft,
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.success },
  description: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, color: colors.success },
});
