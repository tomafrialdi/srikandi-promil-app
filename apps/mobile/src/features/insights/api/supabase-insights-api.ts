import { toIsoDate } from "@/features/calendar/utils/dates";
import { supabase } from "@/lib/supabase";
import type { InsightsData } from "../types";
import type { InsightsApi } from "./insights-api";

export const supabaseInsightsApi: InsightsApi = {
  async get(months = 6) {
    const { data, error } = await supabase.rpc("app_insights", { p_months: months, p_today: toIsoDate(new Date()) });
    if (error) throw new Error(error.message);
    return data as InsightsData;
  },
};
