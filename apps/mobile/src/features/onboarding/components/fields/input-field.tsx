import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import { ICONS } from "../../icons";
import type { InputField as InputFieldConfig } from "../../types";
import { maskDate } from "../../utils/date";
import { FieldShell } from "./field-shell";

interface Props {
  field: InputFieldConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function InputField({ field, value, error, onChange }: Props) {
  const [focused, setFocused] = useState(false);
  const Icon = field.icon ? ICONS[field.icon] : null;

  const handleChange = (text: string) => {
    if (field.type === "date") onChange(maskDate(text));
    else if (field.type === "number") onChange(text.replace(/[^0-9.]/g, ""));
    else onChange(text);
  };

  return (
    <FieldShell label={field.label} error={error}>
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          error ? styles.boxError : null,
        ]}
      >
        {Icon ? <Icon size={18} color={colors.inkFaint} /> : null}
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={field.placeholder}
          placeholderTextColor={colors.inkFaint}
          keyboardType={
            field.type === "date"
              ? "number-pad"
              : field.type === "number"
                ? "decimal-pad"
                : "default"
          }
          maxLength={field.type === "date" ? 14 : undefined}
          autoCapitalize={field.autoCapitalize ?? "none"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
      </View>
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  boxFocused: { borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  input: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
});
