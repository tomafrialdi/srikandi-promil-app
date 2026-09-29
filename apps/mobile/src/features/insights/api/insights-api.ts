import type { InsightsData } from "../types";
import { USE_DUMMY_INSIGHTS } from "./config";
import { dummyInsightsApi } from "./dummy-insights-api";
import { httpInsightsApi } from "./http-insights-api";

/**
 * What the Insights screen needs from the backend.
 *
 *   GET /insights?months=6 -> InsightsData
 */
export interface InsightsApi {
  get(months?: number): Promise<InsightsData>;
}

/** The single switch between dummy data and the real backend. */
export const insightsApi: InsightsApi = USE_DUMMY_INSIGHTS ? dummyInsightsApi : httpInsightsApi;
