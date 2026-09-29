import { request } from "@/utils/http";
import type { TrackingModeData } from "../types";
import type { TrackingModeApi } from "./tracking-mode-api";

export const httpTrackingModeApi: TrackingModeApi = {
  get: () => request<TrackingModeData>("/tracking-mode"),
  select: (modeId) => request<void>("/tracking-mode", { method: "PUT", body: JSON.stringify({ modeId }) }),
};
