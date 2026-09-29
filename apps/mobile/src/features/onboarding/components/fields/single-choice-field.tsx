import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { SingleChoiceField as SingleChoiceConfig } from "../../types";
import { FieldShell } from "./field-shell";

interface Props {
  field: SingleChoiceConfig;
  value?: string;
  error?: string;
  onChange: (value: string) => void;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export function SingleChoiceField({ field, value, error, onChange }: Props) {
  const rows = chunk(field.options, field.columns ?? 3);
  const columns = field.columns ?? 3;

  return (
    <FieldShell label={field.label} error={error}>
      <View style={styles.grid}>
        {rows.map((row, r) => (
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
                  <Text style={[styles.text, selected && styles.textSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
            {row.length < columns
              ? Array.from({ length: columns - row.length }, (_, i) => (
                  <View key={`pad-${i}`} style={styles.chipPlaceholder} />
                ))
              : null}
          </View>
        ))}
      </View>
    </FieldShell>
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipPlaceholder: { flex: 1 },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  text: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
  textSelected: { color: colors.primary },
});
