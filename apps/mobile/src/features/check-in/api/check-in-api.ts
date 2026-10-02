import type { CheckInData, CheckInInput } from "../types";
import { supabaseCheckInApi } from "./supabase-check-in-api";

/**
 * What the Daily check-in screen needs from the backend (Supabase RPCs `app_check_in_get` and
 * `app_log_save`). A check-in is the day's mood log; saving again that day replaces it.
 * The Home card reads the same data (`checkIn.selectedMoodId` and `streakDays`).
 */
export interface CheckInApi {
  getToday(): Promise<CheckInData>;
  save(input: CheckInInput): Promise<void>;
}

export const checkInApi: CheckInApi = supabaseCheckInApi;
