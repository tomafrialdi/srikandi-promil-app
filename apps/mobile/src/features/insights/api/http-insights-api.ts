import type { InsightsData } from "../types";
import type { InsightsApi } from "./insights-api";

/**
 * Real backend implementation. Fill in `BASE_URL` / auth and it is ready.
 * TODO(backend): base URL from env, and attach the user's access token.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export const httpInsightsApi: InsightsApi = {
  async get(months = 6) {
    const response = await fetch(`${BASE_URL}/insights?months=${months}`, {
      headers: {
        "Content-Type": "application/json",
        // TODO(backend): Authorization: `Bearer ${accessToken}`
      },
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status} /insights`);
    return (await response.json()) as InsightsData;
  },
};
