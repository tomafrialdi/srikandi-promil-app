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
  ageYears: number;
  /** e.g. "Dec 2025 – May 2026 · 6 cycles". */
  rangeLabel: string;
  /** Four figures shown in a 2 x 2 grid. */
  stats: { label: string; value: string }[];
  bbt: {
    title: string;
    biphasic: boolean;
    /** Cycle day of ovulation (highlighted bar). */
    ovulationDay: number;
    /** Basal temperature per cycle day, in °C, starting at day 1. */
    temps: number[];
  };
  /** Points to discuss with the doctor; null hides the box. */
  flag: string | null;
}

export interface ReportData {
  preview: ReportPreview;
  /** Which sections start switched on. */
  include: Record<ReportSection, boolean>;
}

export interface ReportRequest {
  range: ReportRange;
  include: Record<ReportSection, boolean>;
}
