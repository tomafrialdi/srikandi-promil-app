export type CyclePhase = "period" | "follicular" | "fertile" | "ovulation" | "luteal" | "late";

/** How the ovulation date was decided: from the calendar, or from a logged sign. */
export type OvulationSource = "calendar" | "fluid" | "lh";

/** Where the user is in their cycle today (Supabase RPC `app_cycle_summary`). Dates are "YYYY-MM-DD". */
export interface CycleSummary {
  hasData: true;
  cycleNo: number;
  /** First day of the current cycle. */
  cycleStart: string;
  /** Day 1 = first day of the period. */
  cycleDay: number;
  phase: CyclePhase;
  cycleLength: number;
  periodLength: number;
  lutealDays: number;
  ovulationDate: string;
  ovulationSource: OvulationSource;
  fertileStart: string;
  fertileEnd: string;
  nextPeriod: string;
  daysToOvulation: number;
  daysToFertile: number;
  daysToNextPeriod: number;
  /** Set when the expected period date has passed (0 = due today). */
  daysLate: number | null;
  /** Finished cycles the prediction has learned from. */
  closedCycles: number;
  /** Irregular cycles / PCOS: predictions are rougher and signs matter more. */
  irregular: boolean;
  confidence: "low" | "medium" | "high";
}

/** The user has no cycle on record yet (e.g. onboarding wasn't saved). */
export interface NoCycle {
  hasData: false;
}
