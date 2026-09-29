import {
  BookOpen,
  Bell,
  CalendarDots,
  CalendarX,
  HandHeart,
  Heart,
  Pulse,
  Sparkle,
  Syringe,
  TestTube,
  Timer,
  type Icon,
} from "phosphor-react-native";

import type { ChangeIconName, ModeIconName } from "./types";

export const MODE_ICONS: Record<ModeIconName, Icon> = {
  sparkle: Sparkle,
  pulse: Pulse,
  syringe: Syringe,
  "hand-heart": HandHeart,
};

export const CHANGE_ICONS: Record<ChangeIconName, Icon> = {
  "calendar-x": CalendarX,
  "test-tube": TestTube,
  timer: Timer,
  "book-open": BookOpen,
  calendar: CalendarDots,
  bell: Bell,
  heart: Heart,
};
