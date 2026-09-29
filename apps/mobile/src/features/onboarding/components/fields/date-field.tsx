import { useState } from "react";

import { DatePickerSheet } from "@/components/date-picker-sheet";
import { SelectField } from "@/components/form/select-field";
import { ICONS } from "../../icons";
import type { DateField as DateFieldConfig } from "../../types";
import { formatDate, parseMaskedDate, resolveDateBound } from "../../utils/date";

interface Props {
  field: DateFieldConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function DateField({ field, value, error, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SelectField
        label={field.label}
        icon={field.icon ? ICONS[field.icon] : undefined}
        value={value}
        placeholder={field.placeholder}
        error={error}
        active={open}
        onPress={() => setOpen(true)}
      />
      <DatePickerSheet
        visible={open}
        title={field.label}
        value={parseMaskedDate(value)}
        minDate={resolveDateBound(field.minDate)}
        maxDate={resolveDateBound(field.maxDate)}
        blockedAfter={field.minAge ? resolveDateBound(`-${field.minAge}y`) : undefined}
        blockedMessage={field.minAgeMessage}
        onClose={() => setOpen(false)}
        onConfirm={(date) => {
          onChange(formatDate(date));
          setOpen(false);
        }}
      />
    </>
  );
}
