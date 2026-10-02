import { Lightbulb } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import type { HomeDashboard } from "../types";

export function DailyTipCard({ tip, onPress }: { tip: HomeDashboard["tip"]; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? "button" : undefined} disabled={!onPress} onPress={onPress} style={styles.card}>
      <View style={styles.iconWrap}>
        <Lightbulb size={18} color={colors.info} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{tip.title}</Text>
        <Text style={styles.body}>{tip.body}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.infoSoft,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 11, color: colors.info },
  body: { fontFamily: fonts.medium, fontSize: 12, color: colors.info },
});
