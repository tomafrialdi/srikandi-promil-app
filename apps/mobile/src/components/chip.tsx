import { StyleSheet, Text, View } from "react-native";

import { fonts, radius, tones, type Tone } from "@/constants/theme";

/** Small pill label (category, tag, status) tinted by tone. */
export function Chip({ label, tone = "primary" }: { label: string; tone?: Tone }) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  label: { fontFamily: fonts.bold, fontSize: 10 },
});
