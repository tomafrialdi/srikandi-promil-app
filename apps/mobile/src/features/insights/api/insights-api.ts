import type { InsightsData } from "../types";
import { supabaseInsightsApi } from "./supabase-insights-api";

/**
 * What the Insights screen needs from the backend (Supabase RPC `app_insights`): statistics from the
 * user's finished cycles and logs. Numbers that can't be known yet are null, never made up.
 */
export interface InsightsApi {
  get(months?: number): Promise<InsightsData>;
}

export const insightsApi: InsightsApi = supabaseInsightsApi;
