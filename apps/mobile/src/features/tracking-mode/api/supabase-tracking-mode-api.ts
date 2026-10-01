import { supabase } from "@/lib/supabase";
import { TRACKING_MODES } from "../data/tracking-modes";
import type { TrackingModeData } from "../types";
import type { TrackingModeApi } from "./tracking-mode-api";

/**
 * The screen offers four modes; the database enum (`app_users.tracking_mode`) is finer
 * grained. "Fertility treatment" is stored as `iui` and becomes `ivf` once the treatment
 * program says so.
 */
const ID_TO_DB: Record<string, string> = {
  ttc: "ttc",
  pcos: "pcos",
  treatment: "iui",
  "after-loss": "after_loss",
};
const DB_TO_ID: Record<string, string> = {
  ttc: "ttc",
  pcos: "pcos",
  iui: "treatment",
  ivf: "treatment",
  after_loss: "after-loss",
};

/** Short text for the Settings row, e.g. "PCOS" or "Trying to conceive". */
export function trackingModeLabel(dbMode: string): string {
  const id = DB_TO_ID[dbMode];
  if (id === "pcos") return "PCOS";
  return TRACKING_MODES.find((m) => m.id === id)?.title ?? "";
}

export const supabaseTrackingModeApi: TrackingModeApi = {
  async get(): Promise<TrackingModeData> {
    const { data, error } = await supabase.from("app_users").select("tracking_mode").single();
    if (error) throw new Error(error.message);
    return { selectedId: DB_TO_ID[data.tracking_mode] ?? "", modes: TRACKING_MODES };
  },

  async select(modeId) {
    const dbMode = ID_TO_DB[modeId];
    if (!dbMode) throw new Error(`Unknown tracking mode: ${modeId}`);
    const { error } = await supabase.rpc("app_set_tracking_mode", { p_mode: dbMode });
    if (error) throw new Error(error.message);
  },
};
