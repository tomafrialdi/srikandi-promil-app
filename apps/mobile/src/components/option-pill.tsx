import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

interface OptionPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Stretches to share a row equally with sibling pills. Default true. */
  fill?: boolean;
}

/** Selectable pill (symptoms, time of day, results, yes / no ...). */
export function OptionPill({ label, selected, onPress, fill = true }: OptionPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.pill, fill && styles.fill, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  fill: { flex: 1 },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
  labelSelected: { color: colors.primary },
});
