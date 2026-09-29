import { useMemo, useState } from "react";
import { Keyboard, Pressable, Text } from "react-native";

import { DatePickerSheet } from "@/components/date-picker-sheet";
import { colors } from "@/constants/theme";
import { ICONS } from "../../icons";
import type { DateField as DateFieldConfig } from "../../types";
import { formatDate, parseMaskedDate, resolveDateBound } from "../../utils/date";
import { FieldShell } from "@/components/form/field-shell";
import { fieldStyles as styles } from "@/components/form/field-styles";

interface Props {
  field: DateFieldConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function DateField({ field, value, error, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const Icon = field.icon ? ICONS[field.icon] : null;

  const minDate = useMemo(() => resolveDateBound(field.minDate), [field.minDate]);
  const maxDate = useMemo(() => resolveDateBound(field.maxDate), [field.maxDate]);

  return (
    <FieldShell label={field.label} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={field.label}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={[styles.box, open && styles.boxFocused, error ? styles.boxError : null]}
      >
        {Icon ? <Icon size={18} color={colors.inkFaint} /> : null}
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || field.placeholder}
        </Text>
      </Pressable>

      <DatePickerSheet
        visible={open}
        title={field.label}
        value={parseMaskedDate(value)}
        minDate={minDate}
        maxDate={maxDate}
        onClose={() => setOpen(false)}
        onConfirm={(date) => {
          onChange(formatDate(date));
          setOpen(false);
        }}
      />
    </FieldShell>
  );
}
