import { settingsApi } from "../api/settings-api";
import type { CyclePreferences, Profile, SettingsSummary, UnitPreferences } from "../types";
import { CyclePreferencesSheet } from "./sheets/cycle-preferences-sheet";
import { HelpCenterSheet } from "./sheets/help-center-sheet";
import { PrivacyPolicySheet } from "./sheets/privacy-policy-sheet";
import { RateAppSheet } from "./sheets/rate-app-sheet";
import { UnitsSheet } from "./sheets/units-sheet";
import { PersonalInfoSheet } from "./personal-info-sheet";

export type SettingsSheetId = "personal" | "cycle" | "units" | "help" | "privacy" | "rate";

/** Settings rows that open a sheet, by row id. */
export const ROW_TO_SHEET: Record<string, SettingsSheetId | undefined> = {
  "personal-information": "personal",
  "cycle-preferences": "cycle",
  units: "units",
  "help-center": "help",
  "privacy-policy": "privacy",
  "rate-app": "rate",
};

interface SettingsSheetsProps {
  active: SettingsSheetId | null;
  onClose: () => void;
  summary: SettingsSummary;
  onSaveProfile: (profile: Profile) => Promise<void>;
  onChangeAvatar: (url: string | null) => Promise<void>;
  onSaveCycle: (cycle: CyclePreferences) => Promise<void>;
  onSaveUnits: (units: UnitPreferences) => Promise<void>;
}

/** Every sheet the Settings screen can open. Only the `active` one is visible. */
export function SettingsSheets({
  active,
  onClose,
  summary,
  onSaveProfile,
  onChangeAvatar,
  onSaveCycle,
  onSaveUnits,
}: SettingsSheetsProps) {
  return (
    <>
      <PersonalInfoSheet
        visible={active === "personal"}
        onClose={onClose}
        profile={summary.profile}
        onSave={onSaveProfile}
        onChangeAvatar={onChangeAvatar}
      />
      <CyclePreferencesSheet
        visible={active === "cycle"}
        onClose={onClose}
        cycle={summary.cycle}
        onSave={onSaveCycle}
      />
      <UnitsSheet visible={active === "units"} onClose={onClose} units={summary.units} onSave={onSaveUnits} />
      <HelpCenterSheet visible={active === "help"} onClose={onClose} />
      <PrivacyPolicySheet visible={active === "privacy"} onClose={onClose} />
      <RateAppSheet visible={active === "rate"} onClose={onClose} onSubmit={settingsApi.submitFeedback} />
    </>
  );
}
