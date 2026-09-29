import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import { ICONS } from "../../icons";
import type { MultiChoiceField as MultiChoiceConfig } from "../../types";
import { FieldShell } from "./field-shell";

interface Props {
  field: MultiChoiceConfig;
  value?: string[];
  error?: string;
  onChange: (value: string[]) => void;
}

export function MultiChoiceField({ field, value = [], error, onChange }: Props) {
  const toggle = (optionValue: string, exclusive?: boolean) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
      return;
    }
    const exclusiveValues = field.options.filter((o) => o.exclusive).map((o) => o.value);
    onChange(
      exclusive
        ? [optionValue]
        : [...value.filter((v) => !exclusiveValues.includes(v)), optionValue],
    );
  };

  return (
    <FieldShell label={field.label} error={error}>
      <View style={styles.list}>
        {field.options.map((option) => {
          const selected = value.includes(option.value);
          const Icon = ICONS[selected ? "check-square" : "square"];
          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => toggle(option.value, option.exclusive)}
              style={[styles.row, selected && styles.rowSelected]}
            >
              <Icon size={18} color={selected ? colors.primary : colors.inkFaint} />
              <Text style={[styles.text, selected && styles.textSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  text: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  textSelected: { color: colors.primary },
});
