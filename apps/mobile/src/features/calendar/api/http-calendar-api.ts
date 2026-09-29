import type { CalendarMonth } from "../types";
import type { CalendarApi } from "./calendar-api";

/**
 * Real backend implementation. Fill in `BASE_URL` / auth and it is ready.
 * TODO(backend): base URL from env, and attach the user's access token.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export const httpCalendarApi: CalendarApi = {
  async getMonth(month) {
    const response = await fetch(`${BASE_URL}/calendar?month=${month}`, {
      headers: {
        "Content-Type": "application/json",
        // TODO(backend): Authorization: `Bearer ${accessToken}`
      },
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status} /calendar`);
    return (await response.json()) as CalendarMonth;
  },
};
