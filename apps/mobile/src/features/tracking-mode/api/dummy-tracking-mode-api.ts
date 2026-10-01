import { delay } from "@/utils/http";
import { TRACKING_MODES } from "../data/tracking-modes";
import type { TrackingModeData } from "../types";
import type { TrackingModeApi } from "./tracking-mode-api";

const DATA: TrackingModeData = {
  selectedId: "pcos",
  modes: TRACKING_MODES,
};

let selectedId = DATA.selectedId;

/** The chosen mode's title, for the Settings row while there is no backend. */
export const dummySelectedModeLabel = () => {
  const mode = DATA.modes.find((m) => m.id === selectedId);
  return mode?.id === "pcos" ? "PCOS" : (mode?.title ?? "");
};

export const dummyTrackingModeApi: TrackingModeApi = {
  async get() {
    await delay(150);
    return { ...DATA, selectedId };
  },
  async select(modeId) {
    await delay(150);
    selectedId = modeId;
  },
};
