import type { CalendarDayData, CalendarPhase } from "../types";
import { daysBetween, toIsoDate } from "../utils/dates";
import type { CalendarApi } from "./calendar-api";

const CYCLE_LENGTH = 28;
const PERIOD_DAYS = 5;
const OVULATION_DAY = 15;
const FERTILE_FROM = 10;
const FERTILE_TO = 16;
/** Matches the Home hero: "Cycle Day 14" today, ovulation tomorrow. */
const TODAY_CYCLE_DAY = 14;

/** Dummy logs shown for today and yesterday. */
const LOG_SUMMARIES: Record<number, string> = {
  0: "Feeling great · No symptoms logged",
  [-1]: "Cramping · Basal temp 36.6°C",
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function phaseFor(cycleDay: number): CalendarPhase | null {
  if (cycleDay <= PERIOD_DAYS) return "period";
  if (cycleDay === OVULATION_DAY) return "ovulation";
  if (cycleDay >= FERTILE_FROM && cycleDay <= FERTILE_TO) return "fertile";
  return null;
}

/** Repeats a fixed 28-day cycle backwards and forwards from today, like a simple prediction. */
export const dummyCalendarApi: CalendarApi = {
  async getMonth(month) {
    await delay(150);
    const [year, monthNumber] = month.split("-").map(Number);
    const today = new Date();
    const cycleStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (TODAY_CYCLE_DAY - 1));

    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const days: CalendarDayData[] = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, monthNumber - 1, i + 1);
      const offset = daysBetween(cycleStart, date);
      const cycleDay = (((offset % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH) + 1;
      return {
        date: toIsoDate(date),
        cycleDay,
        phase: phaseFor(cycleDay),
        summary: LOG_SUMMARIES[daysBetween(today, date)] ?? null,
      };
    });

    return { month, days };
  },
};
