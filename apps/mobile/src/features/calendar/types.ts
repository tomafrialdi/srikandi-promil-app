export type CalendarPhase = "period" | "fertile" | "ovulation";

/** One day of a month as the backend describes it. */
export interface CalendarDayData {
  /** "YYYY-MM-DD". */
  date: string;
  /** Day of the current cycle (1 = first day of period); null when unknown. */
  cycleDay: number | null;
  phase: CalendarPhase | null;
  /** Short text of what was logged that day, e.g. "Feeling great · No symptoms logged". */
  summary: string | null;
}

export interface CalendarMonth {
  /** "YYYY-MM". */
  month: string;
  /** Every day of the month, in order. */
  days: CalendarDayData[];
}
