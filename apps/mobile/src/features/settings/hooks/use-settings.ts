import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { settingsApi } from "../api/settings-api";
import type { CyclePreferences, NotificationToggleKey, Profile, SettingsSummary, UnitPreferences } from "../types";
import { unitsLabel } from "../utils/units";

/** Loads the settings summary + optimistic notification toggles (rolled back if the request fails). */
export function useSettings() {
  const [summary, setSummary] = useState<SettingsSummary | null>(null);

  // Loads on first show and again when coming back from a sub-page (so e.g. "Tracking mode" shows its new value).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      settingsApi.getSummary().then((s) => {
        if (!cancelled) setSummary(s);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const setNotification = useCallback(async (key: NotificationToggleKey, enabled: boolean) => {
    const apply = (value: boolean) =>
      setSummary((cur) => (cur ? { ...cur, notifications: { ...cur.notifications, [key]: value } } : cur));

    apply(enabled);
    try {
      await settingsApi.setNotification(key, enabled);
    } catch {
      apply(!enabled);
    }
  }, []);

  /** Saves the profile, then shows the new values (name and email on the profile card). */
  const updateProfile = useCallback(async (profile: Profile) => {
    await settingsApi.updateProfile(profile);
    setSummary((cur) => (cur ? { ...cur, profile } : cur));
  }, []);

  /** Saves the photo URL and shows it right away on the profile card. */
  const updateAvatar = useCallback(async (url: string | null) => {
    await settingsApi.updateAvatar(url);
    setSummary((cur) => (cur ? { ...cur, profile: { ...cur.profile, avatarUrl: url } } : cur));
  }, []);

  const updateCycle = useCallback(async (cycle: CyclePreferences) => {
    await settingsApi.updateCycle(cycle);
    setSummary((cur) => (cur ? { ...cur, cycle } : cur));
  }, []);

  /** Also refreshes the "Metric" / "Imperial" value shown on the Units row. */
  const updateUnits = useCallback(async (units: UnitPreferences) => {
    await settingsApi.updateUnits(units);
    setSummary((cur) =>
      cur ? { ...cur, units, values: { ...cur.values, units: { text: unitsLabel(units) } } } : cur,
    );
  }, []);

  return { summary, setNotification, updateProfile, updateAvatar, updateCycle, updateUnits };
}
