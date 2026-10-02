import { fetchCycleSummary } from "@/features/cycle/api/cycle-api";
import { cycleCaption, phaseLabel } from "@/features/cycle/utils/describe";
import { checkInApi } from "@/features/check-in/api/check-in-api";
import { toIsoDate } from "@/features/calendar/utils/dates";
import { fetchOwnProfile } from "@/features/profile/api/profile-api";
import { ikUrl } from "@/lib/imagekit";
import { supabase } from "@/lib/supabase";
import { MONTH_NAMES } from "@/utils/calendar";
import localDashboard from "../data/home-dashboard.json";
import { tipFor } from "../data/daily-tips";
import type { HomeDashboard, HomeIconName, Note } from "../types";
import { chooseRecommendations, type RecommendationSignals } from "./recommendations";

interface FeedRow {
  recentNotes: { id: string; date: string; kind: string; text: string }[];
  signals: RecommendationSignals;
}

const NOTE_ICONS: Record<string, HomeIconName> = {
  note: "smiley",
  mood: "smiley",
  symptom: "drop",
  temperature: "thermometer",
  cervical_fluid: "waves",
  lh_test: "test-tube",
};

/** "2026-05-20" -> "May 20". */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
}

async function fetchFeed(today: string): Promise<FeedRow> {
  const { data, error } = await supabase.rpc("app_home_feed", { p_today: today });
  if (error) throw new Error(error.message);
  return data as FeedRow;
}

/** Each part falls back on its own: one failed request must not blank the whole screen. */
const settle = <T>(promise: Promise<T>): Promise<T | null> => promise.catch(() => null);

/**
 * Everything the Home screen shows. The greeting, cycle card, check-in, recent notes,
 * recommendations and tip come from the backend; the article and community previews are still
 * static (they follow with their own modules).
 */
export async function fetchHomeDashboard(): Promise<HomeDashboard> {
  const base = localDashboard as unknown as HomeDashboard;
  const today = new Date();

  const [profile, cycle, checkIn, feed] = await Promise.all([
    settle(fetchOwnProfile()),
    settle(fetchCycleSummary()),
    settle(checkInApi.getToday()),
    settle(fetchFeed(toIsoDate(today))),
  ]);

  const cycleCard: HomeDashboard["cycle"] =
    cycle && cycle.hasData
      ? {
          phaseLabel: phaseLabel(cycle),
          day: cycle.cycleDay,
          length: cycle.cycleLength,
          caption: cycleCaption(cycle),
          ctaLabel: base.cycle.ctaLabel,
        }
      : {
          phaseLabel: "Set up your cycle",
          day: 0,
          length: 28,
          caption: "Log your period to start predictions",
          ctaLabel: base.cycle.ctaLabel,
        };

  const notes: Note[] = (feed?.recentNotes ?? []).map((n) => ({
    id: n.id,
    date: shortDate(n.date),
    text: n.text,
    icon: NOTE_ICONS[n.kind] ?? "smiley",
  }));

  return {
    ...base,
    // A failed profile request falls back to a nameless greeting.
    user: { name: profile?.fullName ?? "", avatarUrl: ikUrl(profile?.avatarUrl, { w: 128, h: 128 }) },
    // No notification inbox exists yet, so there is nothing unread to point at.
    hasUnreadNotifications: false,
    cycle: cycleCard,
    checkIn: {
      ...base.checkIn,
      selectedMoodId: checkIn?.today.moodId ?? null,
      streakDays: checkIn?.streakDays ?? 0,
      moods: checkIn?.moods ?? base.checkIn.moods,
    },
    recommendations: {
      ...base.recommendations,
      items: feed ? chooseRecommendations(base.recommendations.items, feed.signals) : base.recommendations.items,
    },
    tip: tipFor(today),
    notes: { ...base.notes, items: notes },
  };
}
