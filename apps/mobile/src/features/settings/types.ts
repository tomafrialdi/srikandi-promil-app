/** Rows of the Settings menu that show a short live value on the right. */
export type SettingsValueKey =
  | "units"
  | "trackingMode"
  | "treatment"
  | "partner"
  | "privacy"
  | "connectedDevices";

export type NotificationToggleKey = "periodReminder" | "ovulationReminder" | "dailyLogReminder";

export interface SettingsValue {
  text: string;
  /** Shown bold in the primary color, e.g. "Connected". */
  highlighted?: boolean;
}

/** The user's personal details (edited in the "Personal information" sheet). */
export interface Profile {
  name: string;
  email: string;
  /** "YYYY-MM-DD". */
  birthDate: string;
  heightCm: number;
  weightKg: number;
}

export type CycleRegularity = "regular" | "irregular" | "not_sure";

export interface CyclePreferences {
  cycleLengthDays: number;
  periodLengthDays: number;
  /** Days between ovulation and the next period. Most people: 12-14. */
  lutealPhaseDays: number;
  regularity: CycleRegularity;
}

export interface UnitPreferences {
  weight: "kg" | "lbs";
  height: "cm" | "in";
  temperature: "c" | "f";
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface PrivacyPolicy {
  /** "YYYY-MM-DD". */
  updatedAt: string;
  /** Highlighted reassurance shown above the sections. */
  note: string;
  sections: { title: string; body: string }[];
}

export interface FeedbackInput {
  /** 1-5. */
  rating: number;
  comment?: string;
}

/** Everything the Settings screen shows. The backend returns this shape. */
export interface SettingsSummary {
  profile: Profile;
  cycle: CyclePreferences;
  units: UnitPreferences;
  /** Missing keys simply show no value. */
  values: Partial<Record<SettingsValueKey, SettingsValue>>;
  notifications: Record<NotificationToggleKey, boolean>;
}
