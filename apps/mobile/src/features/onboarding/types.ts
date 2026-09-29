export type IconName =
  | "arrow-left"
  | "user"
  | "cake"
  | "ruler"
  | "scales"
  | "calendar-heart"
  | "repeat"
  | "check-square"
  | "square";

interface BaseField {
  key: string;
  label: string;
  required?: boolean;
}

export interface InputField extends BaseField {
  type: "text" | "number" | "date";
  icon?: IconName;
  placeholder?: string;
  min?: number;
  max?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

export interface ChoiceOption {
  value: string;
  label: string;
  /** Multi-choice only: selecting this clears the other options. */
  exclusive?: boolean;
}

export interface SingleChoiceField extends BaseField {
  type: "single-choice";
  options: ChoiceOption[];
  /** Options per row. Defaults to 3. */
  columns?: number;
  defaultValue?: string;
}

export interface MultiChoiceField extends BaseField {
  type: "multi-choice";
  options: ChoiceOption[];
  defaultValue?: string[];
}

/** Lays child fields side by side. */
export interface RowField {
  type: "row";
  fields: InputField[];
}

export type FieldConfig =
  | InputField
  | SingleChoiceField
  | MultiChoiceField
  | RowField;

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  fields: FieldConfig[];
}

export interface OnboardingConfig {
  version: number;
  steps: OnboardingStep[];
}

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;
export type StepErrors = Record<string, string>;
