import type { CalendarMonth } from "../types";
import { supabaseCalendarApi } from "./supabase-calendar-api";

/**
 * What the calendar needs from the backend (Supabase RPC `app_calendar_month`).
 * Past days come from the user's real cycles, today onwards from the prediction engine.
 */
export interface CalendarApi {
  getMonth(month: string): Promise<CalendarMonth>;
}

export const calendarApi: CalendarApi = supabaseCalendarApi;
