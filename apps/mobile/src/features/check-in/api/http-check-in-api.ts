import { request } from "@/utils/http";
import type { CheckInData } from "../types";
import type { CheckInApi } from "./check-in-api";

export const httpCheckInApi: CheckInApi = {
  getToday: () => request<CheckInData>("/check-in/today"),
  save: (input) => request<void>("/check-in", { method: "POST", body: JSON.stringify(input) }),
};
