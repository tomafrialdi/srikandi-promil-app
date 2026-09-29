import type { Icon } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { fonts, radius, tones, type Tone } from "@/constants/theme";

interface ChipProps {
  label: string;
  tone?: Tone;
  /** "sm" is 10px text (cards), "md" is 11px with more padding (screen headers). */
  size?: "sm" | "md";
  icon?: Icon;
}

/** Small pill label (category, tag, status) tinted by tone. */
export function Chip({ label, tone = "primary", size = "sm", icon: LeadingIcon }: ChipProps) {
  const { bg, fg } = tones[tone];
  const md = size === "md";
  return (
    <View style={[styles.chip, md ? styles.chipMd : styles.chipSm, { backgroundColor: bg }]}>
      {LeadingIcon ? <LeadingIcon size={11} color={fg} /> : null}
      <Text style={[styles.label, md && styles.labelMd, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.pill,
  },
  chipSm: { paddingVertical: 4, paddingHorizontal: 9 },
  chipMd: { paddingVertical: 5, paddingHorizontal: 10 },
  label: { fontFamily: fonts.bold, fontSize: 10 },
  labelMd: { fontSize: 11 },
});
