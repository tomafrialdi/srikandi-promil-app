import { delay } from "@/utils/http";
import type { TrackingModeData } from "../types";
import type { TrackingModeApi } from "./tracking-mode-api";

const DATA: TrackingModeData = {
  selectedId: "pcos",
  modes: [
    {
      id: "ttc",
      title: "Trying to conceive",
      description: "Regular cycles, calendar + signs",
      icon: "sparkle",
      changesTitle: "standard mode",
      changes: [
        { icon: "calendar", title: "Calendar-based fertile window", description: "Predicted from your average cycle length" },
        { icon: "test-tube", title: "Signs confirm ovulation", description: "LH tests, fluid and temperature refine the estimate" },
        { icon: "bell", title: "Timed reminders", description: "Nudges before your fertile window and period" },
      ],
    },
    {
      id: "pcos",
      title: "Irregular cycles / PCOS",
      description: "Predictions based on daily signs, not the calendar",
      icon: "pulse",
      changesTitle: "PCOS mode",
      changes: [
        { icon: "calendar-x", title: "No fixed ovulation date", description: "We wait for real signs (LH, fluid, BBT) before confirming" },
        { icon: "test-tube", title: "Multiple LH surges handled", description: "PCOS can cause false peaks — we flag them" },
        { icon: "timer", title: "Long-cycle friendly", description: "Cycles up to 90 days won't trigger 'late' alerts" },
        { icon: "book-open", title: "PCOS-specific tips", description: "Insulin, weight, sleep & inositol content" },
      ],
    },
    {
      id: "treatment",
      title: "Fertility treatment",
      description: "IUI, IVF, Clomid or Letrozole protocols",
      icon: "syringe",
      changesTitle: "treatment mode",
      changes: [
        { icon: "calendar", title: "Protocol timeline", description: "Stimulation, trigger, procedure and the two-week wait" },
        { icon: "bell", title: "Medication and appointment reminders", description: "Never miss a shot or a scan" },
        { icon: "book-open", title: "Treatment guidance", description: "What to expect at each stage" },
      ],
    },
    {
      id: "after-loss",
      title: "Trying after loss",
      description: "Gentler tone, no pregnancy countdowns",
      icon: "hand-heart",
      changesTitle: "gentle mode",
      changes: [
        { icon: "heart", title: "A softer tone", description: "Language and notifications adapted with care" },
        { icon: "timer", title: "No pregnancy countdowns", description: "No day-counting or milestone banners" },
        { icon: "book-open", title: "Support resources", description: "Articles and community groups for your journey" },
      ],
    },
  ],
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
