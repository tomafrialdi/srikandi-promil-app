import type { InsightsData } from "../types";
import type { InsightsApi } from "./insights-api";

const CYCLE_DAYS = [29, 27, 28, 30, 28, 28];

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Builds "YYYY-MM" keys for the last `count` months, ending with the current one. */
function lastMonths(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

export const dummyInsightsApi: InsightsApi = {
  async get(months = 6) {
    await delay(200);
    const keys = lastMonths(months);
    const data: InsightsData = {
      periodMonths: months,
      stats: { avgCycleDays: 28, avgPeriodDays: 5, regularityPercent: 92 },
      cycleTrend: keys.map((month, i) => ({ month, days: CYCLE_DAYS[i % CYCLE_DAYS.length] })),
      symptoms: [
        { id: "cramping", label: "Cramping", percent: 80 },
        { id: "fatigue", label: "Fatigue", percent: 65 },
        { id: "bloating", label: "Bloating", percent: 55 },
        { id: "headache", label: "Headache", percent: 40 },
      ],
    };
    return data;
  },
};
