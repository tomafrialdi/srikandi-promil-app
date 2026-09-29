import { ChoiceChips } from "@/components/form/choice-chips";
import { FieldShell } from "@/components/form/field-shell";
import type { SingleChoiceField as SingleChoiceConfig } from "../../types";

interface Props {
  field: SingleChoiceConfig;
  value?: string;
  error?: string;
  onChange: (value: string) => void;
}

export function SingleChoiceField({ field, value, error, onChange }: Props) {
  return (
    <FieldShell label={field.label} error={error}>
      <ChoiceChips options={field.options} value={value} onChange={onChange} columns={field.columns ?? 3} />
    </FieldShell>
  );
}
