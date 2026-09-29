import { CaretRight, type Icon } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, tones, type Tone } from "@/constants/theme";

interface ListRowProps {
  label: string;
  icon: Icon;
  /** Tints the icon box (default is neutral grey). */
  iconTone?: Tone;
  /** Small text on the right, e.g. "Metric". */
  value?: string;
  /** Renders `value` in bold primary color (e.g. "Connected"). */
  valueHighlighted?: boolean;
  onPress?: () => void;
}

/** Tappable settings row: icon box, label, optional value, chevron. */
export function ListRow({ label, icon: RowIcon, iconTone = "neutral", value, valueHighlighted, onPress }: ListRowProps) {
  const tone = tones[iconTone];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: tone.bg }]}>
        <RowIcon size={16} color={tone.fg} />
      </View>
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={[styles.value, valueHighlighted && styles.valueHighlighted]}>{value}</Text> : null}
      <CaretRight size={16} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  value: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkFaint },
  valueHighlighted: { fontFamily: fonts.bold, color: colors.primary },
});
