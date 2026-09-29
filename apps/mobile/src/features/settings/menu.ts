import {
  Heartbeat,
  Lifebuoy,
  Pulse,
  Ruler,
  Shield,
  ShieldCheck,
  Star,
  Syringe,
  User,
  UsersThree,
  Watch,
  FileText,
  type Icon,
} from "phosphor-react-native";
import type { Href } from "expo-router";

import type { Tone } from "@/constants/theme";
import type { NotificationToggleKey, SettingsValueKey } from "./types";

export interface SettingsMenuRow {
  id: string;
  label: string;
  icon: Icon;
  iconTone?: Tone;
  /** Which live value (from the API) to show on the right. */
  valueKey?: SettingsValueKey;
  /** Where the row goes. Leave undefined until that screen is built. */
  href?: Href;
}

export interface SettingsMenuSection {
  title: string;
  rows: SettingsMenuRow[];
}

/** Menu structure of the Settings screen. Reorder, add or remove rows here. */
export const SETTINGS_SECTIONS: SettingsMenuSection[] = [
  {
    title: "Account",
    rows: [
      { id: "personal-information", label: "Personal information", icon: User },
      { id: "cycle-preferences", label: "Cycle preferences", icon: Heartbeat },
      { id: "units", label: "Units", icon: Ruler, valueKey: "units" },
    ],
  },
  {
    title: "Fertility journey",
    rows: [
      { id: "tracking-mode", label: "Tracking mode", icon: Pulse, valueKey: "trackingMode", href: "/settings/tracking-mode" },
      { id: "my-treatment", label: "My treatment", icon: Syringe, valueKey: "treatment", href: "/settings/treatment" },
      { id: "partner", label: "Partner", icon: UsersThree, iconTone: "primary", valueKey: "partner", href: "/settings/partner" },
      { id: "doctor-report", label: "Doctor report", icon: FileText, href: "/settings/doctor-report" },
    ],
  },
];

export const NOTIFICATION_TOGGLES: { key: NotificationToggleKey; label: string; description: string }[] = [
  { key: "periodReminder", label: "Period reminder", description: "Get notified before your period starts" },
  { key: "ovulationReminder", label: "Ovulation reminder", description: "Alerts during your fertile window" },
  { key: "dailyLogReminder", label: "Daily log reminder", description: "A gentle nudge to log your day" },
];

/** Sections shown after the notification toggles. */
export const SETTINGS_SECTIONS_AFTER_NOTIFICATIONS: SettingsMenuSection[] = [
  {
    title: "Privacy & data",
    rows: [
      { id: "privacy-security", label: "Privacy & security", icon: ShieldCheck, valueKey: "privacy", href: "/settings/privacy-security" },
      { id: "connected-devices", label: "Connected devices", icon: Watch, valueKey: "connectedDevices", href: "/settings/connected-devices" },
    ],
  },
  {
    title: "Support",
    rows: [
      { id: "help-center", label: "Help center", icon: Lifebuoy },
      { id: "privacy-policy", label: "Privacy policy", icon: Shield },
      { id: "rate-app", label: "Rate the app", icon: Star },
    ],
  },
];
