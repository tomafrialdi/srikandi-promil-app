import {
  ArrowLeft,
  Cake,
  CalendarHeart,
  CheckSquare,
  Repeat,
  Ruler,
  Scales,
  Square,
  User,
  type Icon,
} from "phosphor-react-native";

import type { IconName } from "./types";

/** Icon names used in onboarding-steps.json -> Phosphor components. */
export const ICONS: Record<IconName, Icon> = {
  "arrow-left": ArrowLeft,
  user: User,
  cake: Cake,
  ruler: Ruler,
  scales: Scales,
  "calendar-heart": CalendarHeart,
  repeat: Repeat,
  square: Square,
  "check-square": CheckSquare,
};
