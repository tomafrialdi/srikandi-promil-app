import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

export interface ChoiceChipOption {
  value: string;
  label: string;
}

interface ChoiceChipsProps {
  options: ChoiceChipOption[];
  value?: string;
  onChange: (value: string) => void;
  /** Chips per row. Default 3. */
  columns?: number;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/** Single-select rounded chips laid out in a grid (rows of `columns`). */
export function ChoiceChips({ options, value, onChange, columns = 3 }: ChoiceChipsProps) {
  return (
    <View style={styles.grid}>
      {chunk(options, columns).map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onChange(option.value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.text, selected && styles.textSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={`pad-${i}`} style={styles.chipPlaceholder} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipPlaceholder: { flex: 1 },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  text: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
  textSelected: { color: colors.primary },
});
