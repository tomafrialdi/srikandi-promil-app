import { USE_DUMMY_API } from "@/config/api";
import type { TrackingModeData } from "../types";
import { dummyTrackingModeApi } from "./dummy-tracking-mode-api";
import { httpTrackingModeApi } from "./http-tracking-mode-api";

/**
 * What the Tracking mode screen needs from the backend.
 *
 *   GET /tracking-mode -> TrackingModeData
 *   PUT /tracking-mode body: { modeId } -> 204
 */
export interface TrackingModeApi {
  get(): Promise<TrackingModeData>;
  select(modeId: string): Promise<void>;
}

export const trackingModeApi: TrackingModeApi = USE_DUMMY_API ? dummyTrackingModeApi : httpTrackingModeApi;
