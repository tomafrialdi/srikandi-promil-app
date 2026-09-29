import type { Icon } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { fonts, radius, tones, type Tone } from "@/constants/theme";

interface InsightCardProps {
  icon: Icon;
  text: string;
  tone?: Tone;
}

/** Tinted hint box with a small icon, e.g. "Ovulation expected in 12–36 hours...". */
export function InsightCard({ icon: CardIcon, text, tone = "info" }: InsightCardProps) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <CardIcon size={16} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
  },
  text: { flex: 1, fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16 },
});
