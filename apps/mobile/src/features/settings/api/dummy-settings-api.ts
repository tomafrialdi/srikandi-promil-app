import { dummyAppLockLabel } from "@/features/privacy-security/api/dummy-privacy-api";
import { dummySelectedModeLabel } from "@/features/tracking-mode/api/dummy-tracking-mode-api";
import { unitsLabel } from "../utils/units";
import content from "./dummy-settings-content.json";
import type {
  CyclePreferences,
  Faq,
  FeedbackInput,
  NotificationToggleKey,
  PrivacyPolicy,
  Profile,
  SettingsSummary,
  UnitPreferences,
} from "../types";
import type { SettingsApi } from "./settings-api";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// In-memory so toggles survive leaving the screen (until the app restarts).
let summary: SettingsSummary = {
  profile: {
    name: "Amara Putri",
    email: "amara.putri@gmail.com",
    birthDate: "1994-03-14",
    heightCm: 165,
    weightKg: 58,
    avatarUrl: null,
  },
  values: {
    units: { text: "Metric" },
    trackingMode: { text: "PCOS" },
    treatment: { text: "IUI · Day 5" },
    partner: { text: "Connected", highlighted: true },
    privacy: { text: "App lock on" },
    connectedDevices: { text: "2 active" },
  },
  cycle: { cycleLengthDays: 28, periodLengthDays: 5, lutealPhaseDays: 14, regularity: "regular" },
  units: { weight: "kg", height: "cm", temperature: "c" },
  notifications: { periodReminder: true, ovulationReminder: true, dailyLogReminder: false },
};

export const dummySettingsApi: SettingsApi = {
  async getSummary() {
    await delay(150);
    // The backend computes these row values; the dummy reads them from the sub-pages' dummy state.
    return {
      ...summary,
      values: {
        ...summary.values,
        units: { text: unitsLabel(summary.units) },
        trackingMode: { text: dummySelectedModeLabel() },
        privacy: { text: dummyAppLockLabel() },
      },
    };
  },
  async setNotification(key: NotificationToggleKey, enabled: boolean) {
    await delay(80);
    summary = { ...summary, notifications: { ...summary.notifications, [key]: enabled } };
  },
  async updateProfile(profile: Profile) {
    await delay(200);
    summary = { ...summary, profile };
  },
  async updateAvatar(url: string | null) {
    await delay(200);
    summary = { ...summary, profile: { ...summary.profile, avatarUrl: url } };
  },
  async updateCycle(cycle: CyclePreferences) {
    await delay(200);
    summary = { ...summary, cycle };
  },
  async updateUnits(units: UnitPreferences) {
    await delay(200);
    summary = { ...summary, units };
  },
  async getFaqs(query = "") {
    await delay(150);
    const q = query.trim().toLowerCase();
    return (content.faqs as Faq[]).filter((f) => !q || `${f.question} ${f.answer}`.toLowerCase().includes(q));
  },
  async getPrivacyPolicy() {
    await delay(150);
    return content.privacyPolicy as PrivacyPolicy;
  },
  async submitFeedback(input: FeedbackInput) {
    await delay(200);
    console.log("[settings] feedback", JSON.stringify(input));
  },
};
