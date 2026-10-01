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
import { USE_DUMMY_SETTINGS } from "./config";
import { dummySettingsApi } from "./dummy-settings-api";
import { supabaseSettingsApi } from "./supabase-settings-api";

/**
 * What the Settings screen needs from the backend.
 *
 *   GET   /settings/summary        -> SettingsSummary
 *   PATCH /settings/notifications  body: { key, enabled } -> 204
 *   PATCH /profile                 body: Profile -> 204
 *   PATCH /settings/cycle          body: CyclePreferences -> 204
 *   PATCH /settings/units          body: UnitPreferences -> 204
 *   GET   /help/faqs?q=<text>      -> { data: Faq[] }
 *   GET   /legal/privacy-policy    -> PrivacyPolicy
 *   POST  /feedback                body: FeedbackInput -> 204
 */
export interface SettingsApi {
  getSummary(): Promise<SettingsSummary>;
  setNotification(key: NotificationToggleKey, enabled: boolean): Promise<void>;
  updateProfile(profile: Profile): Promise<void>;
  updateCycle(cycle: CyclePreferences): Promise<void>;
  updateUnits(units: UnitPreferences): Promise<void>;
  getFaqs(query?: string): Promise<Faq[]>;
  getPrivacyPolicy(): Promise<PrivacyPolicy>;
  submitFeedback(input: FeedbackInput): Promise<void>;
}

/** The single switch between dummy data and the real backend. */
export const settingsApi: SettingsApi = USE_DUMMY_SETTINGS ? dummySettingsApi : supabaseSettingsApi;
