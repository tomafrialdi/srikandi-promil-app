import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

interface FilterChipsProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** Left / right padding of the scrolling row, so chips align with the page but scroll edge to edge. */
  sidePadding?: number;
  /** "sm" is compact (notifications), "md" is roomier (search screens). */
  size?: "sm" | "md";
}

/** Horizontal single-select pill filters. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  sidePadding = 20,
  size = "sm",
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, size === "md" && styles.rowMd, { paddingHorizontal: sidePadding }]}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.id)}
            style={[styles.chip, size === "md" && styles.chipMd, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6 },
  rowMd: { gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipMd: { paddingVertical: 9, paddingHorizontal: 14 },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
  labelActive: { color: colors.white },
});
