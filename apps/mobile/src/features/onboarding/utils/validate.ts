import type {
  Answers,
  DateField,
  FieldConfig,
  InputField,
  MultiChoiceField,
  OnboardingStep,
  SingleChoiceField,
  StepErrors,
} from "../types";
import { maskedDateToIso } from "./date";

export type ValueField = InputField | DateField | SingleChoiceField | MultiChoiceField;

/** Flattens `row` groups so callers can iterate every field that holds a value. */
export function flattenFields(fields: FieldConfig[]): ValueField[] {
  return fields.flatMap((f) => (f.type === "row" ? f.fields : [f]));
}

function isEmpty(value: Answers[string] | undefined): boolean {
  return value === undefined || value.length === 0;
}

export function validateStep(step: OnboardingStep, answers: Answers): StepErrors {
  const errors: StepErrors = {};

  for (const field of flattenFields(step.fields)) {
    const value = answers[field.key];

    if (isEmpty(value)) {
      if (field.required) errors[field.key] = `${field.label} is required`;
      continue;
    }

    if (field.type === "date" && typeof value === "string") {
      if (!maskedDateToIso(value)) errors[field.key] = "Enter a valid date";
    }

    if (field.type === "number" && typeof value === "string") {
      const n = Number(value);
      if (Number.isNaN(n)) errors[field.key] = "Enter a valid number";
      else if (field.min !== undefined && n < field.min)
        errors[field.key] = `Must be at least ${field.min}`;
      else if (field.max !== undefined && n > field.max)
        errors[field.key] = `Must be at most ${field.max}`;
    }
  }

  return errors;
}
