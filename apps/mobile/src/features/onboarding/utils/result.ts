import { MONTH_NAMES, startOfDay } from "@/utils/calendar";
import type { Answers, ResultValues } from "../types";
import { parseMaskedDate } from "./date";

const LUTEAL_DAYS = 14;

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const short = (date: Date) => `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}`;

/**
 * Local estimate: ovulation ≈ cycle length − 14 days after the last period,
 * fertile window = 5 days before to 1 day after ovulation.
 * Rolls forward to the current cycle if the last period is old.
 */
export function calculateResult(answers: Answers): ResultValues | null {
  const lastPeriod = parseMaskedDate(answers.lastPeriodDate as string | undefined);
  const cycleLength = Number(answers.cycleLengthDays);
  if (!lastPeriod || !cycleLength) return null;

  const today = startOfDay(new Date());
  let cycleStart = lastPeriod;
  while (addDays(cycleStart, cycleLength) <= today) cycleStart = addDays(cycleStart, cycleLength);

  const ovulation = addDays(cycleStart, cycleLength - LUTEAL_DAYS);
  const windowStart = addDays(ovulation, -5);
  const windowEnd = addDays(ovulation, 1);
  const nextPeriod = addDays(cycleStart, cycleLength);

  const sameMonth = windowStart.getMonth() === windowEnd.getMonth();
  return {
    ovulationDate: short(ovulation),
    fertileWindow: `${short(windowStart)} – ${short(windowEnd)}`,
    fertileWindowShort: sameMonth
      ? `${short(windowStart)}–${windowEnd.getDate()}`
      : `${short(windowStart)}–${short(windowEnd)}`,
    nextPeriod: short(nextPeriod),
  };
}
