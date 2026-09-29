import {
  Drop,
  Flask,
  Heart,
  Pill,
  Pulse,
  Scan,
  Smiley,
  Stethoscope,
  TestTube,
  Thermometer,
  Waves,
  type Icon,
} from "phosphor-react-native";

import type { HomeIconName } from "./types";

/** Icon names used in home-dashboard.json -> Phosphor components. */
export const HOME_ICONS: Record<HomeIconName, Icon> = {
  thermometer: Thermometer,
  smiley: Smiley,
  drop: Drop,
  pill: Pill,
  waves: Waves,
  "test-tube": TestTube,
  heart: Heart,
  scan: Scan,
  flask: Flask,
  stethoscope: Stethoscope,
  pulse: Pulse,
};
