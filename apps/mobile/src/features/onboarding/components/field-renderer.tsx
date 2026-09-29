import { StyleSheet, View } from "react-native";

import { useOnboarding } from "../context/onboarding-context";
import type { FieldConfig } from "../types";
import { DateField } from "./fields/date-field";
import { InputField } from "./fields/input-field";
import { NumberField } from "./fields/number-field";
import { MultiChoiceField } from "./fields/multi-choice-field";
import { SingleChoiceField } from "./fields/single-choice-field";

/** Maps one entry of the JSON config to its component. Add new field types here. */
export function FieldRenderer({ field }: { field: FieldConfig }) {
  const { answers, errors, setAnswer } = useOnboarding();

  switch (field.type) {
    case "row":
      return (
        <View style={styles.row}>
          {field.fields.map((child) => (
            <View key={child.key} style={styles.rowItem}>
              <FieldRenderer field={child} />
            </View>
          ))}
        </View>
      );

    case "date":
      return (
        <DateField
          field={field}
          value={(answers[field.key] as string | undefined) ?? ""}
          error={errors[field.key]}
          onChange={(v) => setAnswer(field.key, v)}
        />
      );

    case "number":
      return (
        <NumberField
          field={field}
          value={(answers[field.key] as string | undefined) ?? ""}
          error={errors[field.key]}
          onChange={(v) => setAnswer(field.key, v)}
        />
      );

    case "text":
      return (
        <InputField
          field={field}
          value={(answers[field.key] as string | undefined) ?? ""}
          error={errors[field.key]}
          onChange={(v) => setAnswer(field.key, v)}
        />
      );

    case "single-choice":
      return (
        <SingleChoiceField
          field={field}
          value={answers[field.key] as string | undefined}
          error={errors[field.key]}
          onChange={(v) => setAnswer(field.key, v)}
        />
      );

    case "multi-choice":
      return (
        <MultiChoiceField
          field={field}
          value={answers[field.key] as string[] | undefined}
          error={errors[field.key]}
          onChange={(v) => setAnswer(field.key, v)}
        />
      );
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14 },
  rowItem: { flex: 1 },
});
