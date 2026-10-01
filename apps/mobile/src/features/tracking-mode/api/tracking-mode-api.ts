import type { TrackingModeData } from "../types";
import { supabaseTrackingModeApi } from "./supabase-tracking-mode-api";

/**
 * What the Tracking mode screen needs from the backend.
 *
 *   GET `app_users.tracking_mode`  -> TrackingModeData (mode copy is static, see data/)
 *   RPC `app_set_tracking_mode`    <- the chosen mode
 */
export interface TrackingModeApi {
  get(): Promise<TrackingModeData>;
  select(modeId: string): Promise<void>;
}

export const trackingModeApi: TrackingModeApi = supabaseTrackingModeApi;
