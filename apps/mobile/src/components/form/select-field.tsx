import type { Icon } from "phosphor-react-native";
import { Keyboard, Pressable, StyleSheet, Text } from "react-native";

import { colors, fonts } from "@/constants/theme";
import { FieldShell } from "./field-shell";
import { fieldStyles as styles } from "./field-styles";

interface SelectFieldProps {
  label: string;
  /** Selected value as text; empty shows the placeholder. */
  value: string;
  placeholder?: string;
  icon?: Icon;
  /** Unit shown inside the field on the right, e.g. "cm". */
  suffix?: string;
  error?: string;
  /** True while its picker sheet is open (highlights the border). */
  active?: boolean;
  onPress: () => void;
}

/** Field that opens a picker (date, number, ...) instead of a keyboard. */
export function SelectField({
  label,
  value,
  placeholder,
  icon: LeadingIcon,
  suffix,
  error,
  active,
  onPress,
}: SelectFieldProps) {
  return (
    <FieldShell label={label} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          Keyboard.dismiss();
          onPress();
        }}
        style={[styles.box, active && styles.boxFocused, error ? styles.boxError : null]}
      >
        {LeadingIcon ? <LeadingIcon size={18} color={colors.inkFaint} /> : null}
        <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder}</Text>
        {suffix ? <Text style={local.suffix}>{suffix}</Text> : null}
      </Pressable>
    </FieldShell>
  );
}

const local = StyleSheet.create({
  suffix: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
});
