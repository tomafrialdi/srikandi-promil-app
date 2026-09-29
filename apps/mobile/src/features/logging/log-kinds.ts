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
import type { TrackerKind } from "./types";

/** Key of a tile in the "Log today" grid. "pregnancy-test" opens its own page, not a sheet. */
export type TrackerKey = TrackerKind | "pregnancy-test";

export interface TrackerTile {
  key: TrackerKey;
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
};
