import type { Recommendation } from "../types";

/** What the database knows about the user (`app_home_feed.signals`). */
export interface RecommendationSignals {
  /** Days since the last temperature log, or null if never logged. */
  tempDaysAgo: number | null;
  cyclesTracked: number;
  tryingDuration: "lt_6_months" | "6_12_months" | "1_2_years" | "2_plus_years" | null;
  hasProgram: boolean;
}

/**
 * Picks which recommendations apply to this user from the catalog. Supplements are general
 * pre-conception advice; the others only appear when the data says they're useful.
 */
export function chooseRecommendations(catalog: Recommendation[], signals: RecommendationSignals): Recommendation[] {
  const tryingLong = signals.tryingDuration === "1_2_years" || signals.tryingDuration === "2_plus_years";

  return catalog.flatMap((item): Recommendation[] => {
    switch (item.id) {
      case "bbt":
        // Nudge only when temperature logging has lapsed.
        return signals.tempDaysAgo === null || signals.tempDaysAgo > 3 ? [item] : [];
      case "obgyn": {
        if (signals.hasProgram) return []; // Already under a doctor's care.
        if (tryingLong) {
          return [{ ...item, description: "You've been trying for over a year. A check-up is a good next step" }];
        }
        return signals.cyclesTracked >= 3 ? [item] : [];
      }
      default:
        return [item];
    }
  });
}
