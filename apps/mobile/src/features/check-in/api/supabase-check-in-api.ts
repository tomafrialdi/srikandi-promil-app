import { toIsoDate } from "@/features/calendar/utils/dates";
import { supabase } from "@/lib/supabase";
import { CHECK_IN_MOODS, COUNSELLOR, STRESSORS } from "../data/check-in-content";
import type { CheckInData, CheckInInput } from "../types";
import type { CheckInApi } from "./check-in-api";

interface CheckInRow {
  today: { moodId: string; stressorIds: string[]; journal: string } | null;
  week: { date: string; moodId: string | null }[];
  streakDays: number;
}

export const supabaseCheckInApi: CheckInApi = {
  async getToday(): Promise<CheckInData> {
    const { data, error } = await supabase.rpc("app_check_in_get", { p_today: toIsoDate(new Date()) });
    if (error) throw new Error(error.message);
    const row = data as CheckInRow;

    return {
      moods: CHECK_IN_MOODS,
      stressors: STRESSORS,
      today: row.today ?? { moodId: null, stressorIds: [], journal: "" },
      week: row.week,
      streakDays: row.streakDays,
      counsellor: COUNSELLOR,
    };
  },

  /** A check-in is today's mood log, with the stressors and journal stored alongside it. */
  async save(input: CheckInInput) {
    const { error } = await supabase.rpc("app_log_save", {
      p_kind: "mood",
      p_date: toIsoDate(new Date()),
      p_value: input.moodId,
      p_number: null,
      p_payload: { stressors: input.stressorIds, journal: input.journal },
    });
    if (error) throw new Error(error.message);
  },
};
