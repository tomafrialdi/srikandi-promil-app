import {
  Bell,
  BookOpen,
  CalendarCheck,
  ChatCircle,
  FileText,
  Pill,
  Sparkle,
  Thermometer,
  UsersThree,
  type Icon,
} from "phosphor-react-native";

import type { NotificationIconName } from "./notification-types";

export const NOTIFICATION_ICONS: Record<NotificationIconName, Icon> = {
  sparkle: Sparkle,
  users: UsersThree,
  chat: ChatCircle,
  pill: Pill,
  thermometer: Thermometer,
  "calendar-check": CalendarCheck,
  "file-text": FileText,
  "book-open": BookOpen,
  bell: Bell,
};
