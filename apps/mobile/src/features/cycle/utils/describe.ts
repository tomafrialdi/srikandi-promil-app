import type { CyclePhase, CycleSummary } from "../types";

const PHASE_LABEL: Record<CyclePhase, string> = {
  period: "Period",
  follicular: "Follicular phase",
  fertile: "Fertile window",
  ovulation: "Ovulation day",
  luteal: "Luteal phase",
  late: "Period expected",
};

export const phaseLabel = (summary: CycleSummary): string => PHASE_LABEL[summary.phase];

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/**
 * One honest line under the phase, e.g. "Ovulation likely in 3 days". Wording is softer ("around")
 * when the date is only a calendar estimate and no logged sign backs it up.
 */
export function cycleCaption(summary: CycleSummary): string {
  const around = summary.ovulationSource === "calendar" ? "around " : "";

  switch (summary.phase) {
    case "period":
      return `Period day ${summary.cycleDay}`;
    case "follicular":
      return summary.daysToFertile > 0
        ? `Fertile window opens in ${around}${days(summary.daysToFertile)}`
        : "Fertile window is about to open";
    case "fertile":
      if (summary.daysToOvulation > 0) return `Ovulation likely in ${around}${days(summary.daysToOvulation)}`;
      return summary.daysToOvulation === 0 ? "Ovulation likely today" : "Ovulation likely just passed";
    case "ovulation":
      return "Ovulation likely today";
    case "luteal":
      return `Next period in ${around}${days(Math.max(summary.daysToNextPeriod, 0))}`;
    case "late":
      return summary.daysLate === 0
        ? "Period expected today"
        : `Period is ${days(summary.daysLate ?? 0)} late · log it when it starts`;
  }
}
