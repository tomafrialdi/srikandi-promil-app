import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

interface FilterChipsProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** Left / right padding of the scrolling row, so chips align with the page but scroll edge to edge. */
  sidePadding?: number;
}

/** Horizontal single-select pill filters. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  sidePadding = 20,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: sidePadding }]}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.id)}
            style={[styles.chip, active && styles.chipActive]}
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
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
  labelActive: { color: colors.white },
});
