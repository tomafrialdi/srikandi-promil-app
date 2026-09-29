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
  stats: {
    avgCycleDays: number;
    avgPeriodDays: number;
    regularityPercent: number;
  };
  /** Oldest first. The last point is highlighted as "this month". */
  cycleTrend: CycleTrendPoint[];
  /** Most frequent first. */
  symptoms: SymptomFrequency[];
}
