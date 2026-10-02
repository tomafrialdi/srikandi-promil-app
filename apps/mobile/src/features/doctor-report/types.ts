export type ReportRange = "last-3" | "last-6" | "all";

export type ReportSection =
  | "cycleHistory"
  | "bbt"
  | "tests"
  | "fluidSymptoms"
  | "medications"
  | "intimacy"
  | "notes";

export interface ReportPreview {
  name: string;
  /** null when the birth date isn't known. */
  ageYears: number | null;
  /** e.g. "Dec 2025 – May 2026 · 6 cycles". */
  rangeLabel: string;
  /** Four figures shown in a 2 x 2 grid. */
  stats: { label: string; value: string }[];
  /** null until the user has logged temperatures (the chart is hidden). */
  bbt: null | {
    title: string;
    biphasic: boolean;
    /** Cycle day of ovulation (highlighted bar). */
    ovulationDay: number;
    /** Basal temperature per cycle day, in °C, starting at day 1; null for days without a reading. */
    temps: (number | null)[];
  };
  /** Points to discuss with the doctor; null hides the box. */
  flag: string | null;
}

/** Everything the report can contain; the PDF only includes the sections switched on. */
export interface ReportDetails {
  cycles: { cycle_no: number; start_date: string; length_days: number | null; ovulation_day: number | null; luteal_days: number | null }[];
  tests: {
    lh: { date: string; result: string }[];
    pregnancy: { date: string; result: string; type: string | null }[];
  };
  fluid: { date: string; type: string }[];
  symptoms: { label: string; days: number }[];
  intimacy: string[];
  notes: { date: string; text: string }[];
}

export interface ReportData {
  preview: ReportPreview;
  details: ReportDetails;
  /** Which sections start switched on. */
  include: Record<ReportSection, boolean>;
}

export interface ReportRequest {
  range: ReportRange;
  include: Record<ReportSection, boolean>;
}
