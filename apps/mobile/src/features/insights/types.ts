export interface CycleTrendPoint {
  /** "YYYY-MM". */
  month: string;
  /** Length of the cycle that started in that month, in days. */
  days: number;
}

export interface SymptomFrequency {
  id: string;
  label: string;
  /** Share of tracked cycles (or days) with this symptom, 0-100. */
  percent: number;
}

/** Everything the Insights screen shows. The backend returns this shape. */
export interface InsightsData {
  /** How many months the numbers cover; shown in the subtitle. */
  periodMonths: number;
  /** Finished cycles the numbers are based on. */
  cyclesCounted: number;
  /** Days in the period that have a symptom log. */
  symptomDays: number;
  /** Null until there is enough data (e.g. regularity needs two finished cycles). */
  stats: {
    avgCycleDays: number | null;
    avgPeriodDays: number | null;
    regularityPercent: number | null;
  };
  /** Oldest first. The last point is highlighted as "this month". */
  cycleTrend: CycleTrendPoint[];
  /** Most frequent first. */
  symptoms: SymptomFrequency[];
}
