import {
  Drop,
  Heart,
  Pill,
  Scan,
  Thermometer,
  TestTube,
  Waves,
  Smiley,
  type Icon,
} from "phosphor-react-native";

import type { Tone } from "@/constants/theme";
import type { LogKind, TrackerKind } from "./types";

export interface TrackerTile {
  key: TrackerKind;
  label: string;
  icon: Icon;
  tone: Tone;
}

/** Tiles of the "Log today" grid, in display order (4 per row). */
export const TRACKER_TILES: TrackerTile[] = [
  { key: "temperature", label: "Temp", icon: Thermometer, tone: "error" },
  { key: "mood", label: "Mood", icon: Smiley, tone: "warning" },
  { key: "symptom", label: "Symptom", icon: Drop, tone: "info" },
  { key: "medications", label: "Meds", icon: Pill, tone: "success" },
  { key: "cervical-fluid", label: "Cervical fluid", icon: Waves, tone: "info" },
  { key: "lh-test", label: "LH test", icon: TestTube, tone: "primary" },
  { key: "intimacy", label: "Intimacy", icon: Heart, tone: "primary" },
  { key: "pregnancy-test", label: "Preg. test", icon: Scan, tone: "success" },
];

/** Home quick-action ids (home-dashboard.json) -> the sheet they open. */
export const QUICK_ACTION_TO_KIND: Record<string, TrackerKind | undefined> = {
  temp: "temperature",
  mood: "mood",
  symptom: "symptom",
  meds: "medications",
  fluid: "cervical-fluid",
  "lh-test": "lh-test",
  intimacy: "intimacy",
  "preg-test": "pregnancy-test",
};

/** Home recommendation ids (home-dashboard.json) -> the sheet they open. */
export const RECOMMENDATION_TO_KIND: Record<string, LogKind | undefined> = {
  prenatal: "prenatal-vitamin",
  folic: "folic-acid",
  bbt: "basal-temperature-guide",
};
