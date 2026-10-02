import { toIsoDate } from "@/features/calendar/utils/dates";
import { supabase } from "@/lib/supabase";
import type { CardScreen, ContentCard, ContentEvent, DailyTip, VideoItem, VideoPlacement } from "../types";

/** Content authored in the console's Content library, as the signed-in user should see it today. */

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const fetchContentCards = (screen: CardScreen) =>
  call<ContentCard[]>("app_content_cards", { p_screen: screen, p_today: toIsoDate(new Date()) });

/** null when no tip is published for this user today. */
export const fetchDailyTip = () => call<DailyTip | null>("app_daily_tip", { p_today: toIsoDate(new Date()) });

export const fetchVideos = (placement: VideoPlacement) =>
  call<VideoItem[]>("app_videos", { p_placement: placement, p_today: toIsoDate(new Date()) });

/** Analytics and card rules (dismissed, frequency cap, converted). Never blocks the UI. */
export function recordContentEvent(id: string, event: ContentEvent, variant?: number): void {
  supabase
    .rpc("app_content_event", { p_id: id, p_event: event, p_variant: variant ?? null })
    .then(({ error }) => {
      if (error && __DEV__) console.warn("[content] event failed", event, error.message);
    });
}
