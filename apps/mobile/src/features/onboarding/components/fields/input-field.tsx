import { TextField } from "@/components/form/text-field";
import { ICONS } from "../../icons";
import type { InputField as InputFieldConfig } from "../../types";

interface Props {
  field: InputFieldConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function InputField({ field, value, error, onChange }: Props) {
  return (
    <TextField
      label={field.label}
      icon={field.icon ? ICONS[field.icon] : undefined}
      placeholder={field.placeholder}
      value={value}
      error={error}
      autoCapitalize={field.autoCapitalize ?? "none"}
      onChange={onChange}
    />
  );
}
