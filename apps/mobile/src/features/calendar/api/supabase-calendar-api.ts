import { supabase } from "@/lib/supabase";
import type { CalendarMonth } from "../types";
import { toIsoDate } from "../utils/dates";
import type { CalendarApi } from "./calendar-api";

export const supabaseCalendarApi: CalendarApi = {
  async getMonth(month) {
    const { data, error } = await supabase.rpc("app_calendar_month", {
      p_month: month,
      p_today: toIsoDate(new Date()),
    });
    if (error) throw new Error(error.message);
    return data as CalendarMonth;
  },
};
