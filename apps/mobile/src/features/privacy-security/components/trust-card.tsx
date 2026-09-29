import { Check, ShieldCheck } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

/** Dark reassurance card: "Your data is yours" with a checklist. */
export function TrustCard({ points }: { points: string[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <ShieldCheck size={22} color={colors.mint} />
        <Text style={styles.title}>Your data is yours</Text>
      </View>
      {points.map((point) => (
        <View key={point} style={styles.point}>
          <Check size={14} weight="bold" color={colors.mint} />
          <Text style={styles.pointText}>{point}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14, padding: 20, borderRadius: 22, backgroundColor: colors.ink },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  point: { flexDirection: "row", alignItems: "center", gap: 10 },
  pointText: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: colors.whiteStrong },
});
