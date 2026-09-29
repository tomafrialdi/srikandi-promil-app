import { USE_DUMMY_API } from "@/config/api";
import type { CheckInData, CheckInInput } from "../types";
import { dummyCheckInApi } from "./dummy-check-in-api";
import { httpCheckInApi } from "./http-check-in-api";

/**
 * What the Daily check-in screen needs from the backend.
 *
 *   GET  /check-in/today -> CheckInData
 *   POST /check-in       body: CheckInInput -> 204   (saves or updates today's check-in)
 *
 * The Home card ("How are you feeling today?") reads the same data through
 * `GET /home` (its `checkIn.selectedMoodId` and `streakDays`).
 */
export interface CheckInApi {
  getToday(): Promise<CheckInData>;
  save(input: CheckInInput): Promise<void>;
}

export const checkInApi: CheckInApi = USE_DUMMY_API ? dummyCheckInApi : httpCheckInApi;
