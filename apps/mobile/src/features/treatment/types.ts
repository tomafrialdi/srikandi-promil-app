import type { Tone } from "@/constants/theme";

export type TreatmentType = "iui" | "ivf" | "medicated";

export interface TreatmentProgram {
  id: string;
  type: TreatmentType;
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
  id: string;
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
  /** null until the user starts a program. */
  program: TreatmentProgram | null;
  schedule: ScheduleItem[];
  appointment: Appointment | null;
  labs: LabResult[];
}

export interface StartProgramInput {
  type: TreatmentType;
  protocol: string;
  doctor: string;
  /** "YYYY-MM-DD". */
  startedOn: string;
  cycleNo: number;
}

export interface ScheduleInput {
  title: string;
  description: string;
  kind: ScheduleItem["kind"];
  tag?: string;
}

export interface AppointmentInput {
  /** ISO date-time with a time zone (e.g. from `Date.toISOString()`). */
  startsAt: string;
  title: string;
  place: string;
}

export interface LabInput {
  label: string;
  value: string;
  statusLabel: string;
  tone: Tone;
}
