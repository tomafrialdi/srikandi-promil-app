import { toIsoDate } from "@/features/calendar/utils/dates";
import { supabase } from "@/lib/supabase";
import type { CycleSummary, NoCycle } from "../types";

/** Today's cycle position, from the prediction engine in the database. */
export async function fetchCycleSummary(): Promise<CycleSummary | NoCycle> {
  const { data, error } = await supabase.rpc("app_cycle_summary", { p_today: toIsoDate(new Date()) });
  if (error) throw new Error(error.message);
  return data as CycleSummary | NoCycle;
}
