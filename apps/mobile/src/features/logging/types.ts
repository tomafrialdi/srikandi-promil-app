import type { Tone } from "@/constants/theme";

export type LogKind =
  | "log-today"
  | "temperature"
  | "mood"
  | "symptom"
  | "medications"
  | "cervical-fluid"
  | "lh-test"
  | "intimacy";

/** Kinds that record something (everything except the "Log today" hub). */
export type TrackerKind = Exclude<LogKind, "log-today">;

export type MoodIconName = "wink" | "smile" | "meh" | "sad" | "angry";

export interface Option {
  id: string;
  label: string;
}

export interface MoodOption extends Option {
  icon: MoodIconName;
}

export interface Medication {
  id: string;
  name: string;
  /** Display time, e.g. "9:00 AM". */
  time: string;
  taken: boolean;
}

export interface FluidOption extends Option {
  description: string;
  tag: { label: string; tone: Tone; /** Filled instead of tinted. */ emphasis?: boolean };
  insight: string;
}

export interface LhResultOption extends Option {
  insight: string;
}

export type IntimacyDayStatus = "logged" | "today" | "best" | "none";

export interface IntimacyDay {
  weekday: string;
  date: number;
  status: IntimacyDayStatus;
}

/** Everything the log sheets show. The backend returns this shape from `getData()`. */
export interface LoggingData {
  overview: {
    loggedKinds: TrackerKind[];
    summary: { title: string; /** `{count}` and `{total}` are filled in by the app. */ description: string };
    hint: string;
  };
  temperature: {
    min: number;
    max: number;
    step: number;
    default: number;
    caption: string;
    timesOfDay: Option[];
    defaultTimeOfDay: string;
  };
  mood: { options: MoodOption[]; notePlaceholder: string };
  symptoms: Option[];
  medications: Medication[];
  cervicalFluid: { subtitle: string; options: FluidOption[] };
  lhTest: {
    /** Result read from the photo by AI; null when no photo was taken yet. */
    reading: { resultId: string; label: string; confidencePercent: number } | null;
    results: LhResultOption[];
  };
  intimacy: {
    subtitle: string;
    score: { done: number; total: number };
    days: IntimacyDay[];
    insight: string;
  };
}

/** One request body per kind. Sent to `POST /logs`. */
export type SaveLogInput =
  | { kind: "temperature"; celsius: number; timeOfDay: string }
  | { kind: "mood"; moodId: string; note?: string }
  | { kind: "symptom"; symptomIds: string[] }
  | { kind: "medications"; takenIds: string[] }
  | { kind: "cervical-fluid"; fluidId: string }
  | { kind: "lh-test"; resultId: string }
  | { kind: "intimacy"; hadIntimacy: boolean };
