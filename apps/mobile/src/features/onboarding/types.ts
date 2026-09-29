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
  type: "text" | "number";
  icon?: IconName;
  placeholder?: string;
  min?: number;
  max?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

/**
 * Opens the shared date-picker sheet. Bounds accept "today", an ISO date
 * ("2000-01-31"), or a relative past date like "-100y".
 */
export interface DateField extends BaseField {
  type: "date";
  icon?: IconName;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
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
  fields: (InputField | DateField)[];
}

export type FieldConfig =
  | InputField
  | DateField
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

export interface LoadingTask {
  id: string;
  label: string;
  /** How long the task stays "in progress" before the next one starts. */
  durationMs: number;
}

export interface LoadingConfig {
  title: string;
  subtitle: string;
  footnote: string;
  /** Enabled once every task is done. */
  ctaLabel: string;
  tasks: LoadingTask[];
}

export type ResultIconName = "calendar-heart" | "heart" | "clock";
export type ResultTone = "primary" | "info" | "warning";

/** Keys produced by `calculateResult` (utils/result.ts). */
export type ResultValueKey = "ovulationDate" | "fertileWindow" | "nextPeriod";

export interface ResultCard {
  id: string;
  label: string;
  icon: ResultIconName;
  tone: ResultTone;
  valueKey: ResultValueKey;
}

export interface ResultConfig {
  title: string;
  subtitle: string;
  note: string;
  ctaLabel: string;
  cards: ResultCard[];
  /** Shown on the sign-up screen. `{fertileWindowShort}` is replaced with e.g. "May 11–16". */
  signUpBanner: string;
}

export type ResultValues = Record<ResultValueKey | "fertileWindowShort", string>;

export interface OnboardingConfig {
  version: number;
  steps: OnboardingStep[];
  loading: LoadingConfig;
  result: ResultConfig;
}

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;
export type StepErrors = Record<string, string>;
