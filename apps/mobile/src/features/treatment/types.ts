import type { Tone } from "@/constants/theme";

export interface TreatmentProgram {
  /** e.g. "IUI · Cycle 1". */
  title: string;
  /** e.g. "Letrozole protocol · dr. Sarah Lestari". */
  subtitle: string;
  /** e.g. "Day 5". */
  dayLabel: string;
  stages: { id: string; label: string }[];
  currentStageIndex: number;
}

export interface ScheduleItem {
  id: string;
  title: string;
  /** e.g. "08:00 · after breakfast". */
  description: string;
  kind: "medication" | "event";
  /** Medications only: taken today. */
  done?: boolean;
  /** Events only: small pink tag, e.g. "Reminder on". */
  tag?: string;
}

export interface Appointment {
  /** ISO date-time, e.g. "2026-05-23T09:30:00". */
  startsAt: string;
  title: string;
  place: string;
}

export interface LabResult {
  id: string;
  label: string;
  value: string;
  status: { label: string; tone: Tone };
}

/** Everything the My treatment screen shows. The backend returns this shape. */
export interface TreatmentData {
  program: TreatmentProgram;
  schedule: ScheduleItem[];
  appointment: Appointment | null;
  labs: LabResult[];
}
