import { useState } from "react";

import { SelectField } from "@/components/form/select-field";
import { NumberPickerSheet } from "@/components/number-picker-sheet";
import { ICONS } from "../../icons";
import type { NumberField as NumberFieldConfig } from "../../types";

interface Props {
  field: NumberFieldConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function NumberField({ field, value, error, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SelectField
        label={field.label}
        icon={field.icon ? ICONS[field.icon] : undefined}
        value={value}
        placeholder={field.placeholder}
        suffix={field.unit}
        error={error}
        active={open}
        onPress={() => setOpen(true)}
      />
      <NumberPickerSheet
        visible={open}
        title={field.label}
        min={field.min}
        max={field.max}
        step={field.step}
        unit={field.unit}
        initialValue={field.initialValue}
        value={value ? Number(value) : null}
        onClose={() => setOpen(false)}
        onConfirm={(n) => {
          onChange(String(n));
          setOpen(false);
        }}
      />
    </>
  );
}
