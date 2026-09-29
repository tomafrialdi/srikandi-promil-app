import type { CalendarMonth } from "../types";
import { USE_DUMMY_CALENDAR } from "./config";
import { dummyCalendarApi } from "./dummy-calendar-api";
import { httpCalendarApi } from "./http-calendar-api";

/**
 * What the calendar needs from the backend.
 *
 *   GET /calendar?month=YYYY-MM -> CalendarMonth   (predictions + logged summaries for that month)
 */
export interface CalendarApi {
  getMonth(month: string): Promise<CalendarMonth>;
}

/** The single switch between dummy data and the real backend. */
export const calendarApi: CalendarApi = USE_DUMMY_CALENDAR ? dummyCalendarApi : httpCalendarApi;
