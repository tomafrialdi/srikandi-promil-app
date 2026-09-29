import type { Tone } from "@/constants/theme";

/** Sheets that record a daily sign. They get a tile (and a check) in the "Log today" hub. */
export type TrackerKind =
  | "temperature"
  | "mood"
  | "symptom"
  | "medications"
  | "cervical-fluid"
  | "lh-test"
  | "intimacy"
  | "pregnancy-test";

/** Supplement pickers opened from the Home recommendations. */
export type SupplementKind = "prenatal-vitamin" | "folic-acid";

export type LogKind = "log-today" | TrackerKind | SupplementKind | "basal-temperature-guide";

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

export type PregnancyResultIcon = "minus" | "circle-dashed" | "plus";

export interface PregnancyResultOption extends Option {
  icon: PregnancyResultIcon;
  tone: Tone;
}

export interface SupplementProduct {
  id: string;
  name: string;
  rating: number;
  /** Display text, e.g. "1.2k". */
  reviews: string;
  /** Display text including currency, e.g. "$24.99". */
  price: string;
  recommended?: boolean;
}

export interface SupplementCatalog {
  title: string;
  subtitle: string;
  icon: "pill" | "flask";
  defaultProductId: string;
  products: SupplementProduct[];
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
  pregnancyTest: {
    /** Shown when testing is likely too early; null hides it. */
    warning: string | null;
    results: PregnancyResultOption[];
    testTypes: Option[];
    photo: { title: string; description: string };
  };
  supplements: Record<SupplementKind, SupplementCatalog>;
  basalGuide: { title: string; subtitle: string; steps: string[]; tip: string };
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
  | { kind: "intimacy"; hadIntimacy: boolean }
  | { kind: "pregnancy-test"; resultId: string; testTypeId: string }
  /** Not a daily sign: adds the chosen product to the user's routine. */
  | { kind: "supplement"; category: SupplementKind; productId: string };
