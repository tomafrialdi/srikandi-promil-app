import { supabase } from "@/lib/supabase";
import type { CyclePreferences, Profile, SettingsSummary, UnitPreferences } from "../types";
import { dummySettingsApi } from "./dummy-settings-api";
import type { SettingsApi } from "./settings-api";

/**
 * Personal information, cycle preferences and units live in Supabase (`app_users` + the
 * `app_update_*` RPCs). Everything else still comes from the dummy API.
 * TODO(backend): move notifications, FAQs, privacy policy and feedback over as they are built.
 */

// Only used when onboarding was never saved (e.g. the app closed right after verifying the
// email); the user can correct them in the sheets.
const FALLBACK = {
  birthDate: "2000-01-01",
  heightCm: 165,
  weightKg: 60,
  cycleLengthDays: 28,
  cycleRegularity: "regular",
} as const;

const COLUMNS = [
  "full_name",
  "email",
  "birth_date",
  "height_cm",
  "weight_kg",
  "cycle_length_days",
  "period_length_days",
  "luteal_phase_days",
  "cycle_regularity",
  "unit_weight",
  "unit_height",
  "unit_temperature",
].join(",");

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const supabaseSettingsApi: SettingsApi = {
  ...dummySettingsApi,

  async getSummary(): Promise<SettingsSummary> {
    const [dummy, { data, error }] = await Promise.all([
      dummySettingsApi.getSummary(),
      supabase.from("app_users").select(COLUMNS).single(),
    ]);
    check(error);
    const row = data as unknown as Record<string, any>;

    const units: UnitPreferences = {
      weight: row.unit_weight,
      height: row.unit_height,
      temperature: row.unit_temperature,
    };
    return {
      ...dummy,
      profile: {
        name: row.full_name,
        email: row.email,
        birthDate: row.birth_date ?? FALLBACK.birthDate,
        heightCm: row.height_cm ?? FALLBACK.heightCm,
        weightKg: Number(row.weight_kg ?? FALLBACK.weightKg),
      },
      cycle: {
        cycleLengthDays: row.cycle_length_days ?? FALLBACK.cycleLengthDays,
        periodLengthDays: row.period_length_days,
        lutealPhaseDays: row.luteal_phase_days,
        regularity: row.cycle_regularity ?? FALLBACK.cycleRegularity,
      },
      units,
    };
  },

  async updateProfile(profile: Profile) {
    const { error } = await supabase.rpc("app_update_profile", {
      p_name: profile.name,
      p_birth_date: profile.birthDate,
      p_height_cm: profile.heightCm,
      p_weight_kg: profile.weightKg,
    });
    check(error);
  },

  async updateCycle(cycle: CyclePreferences) {
    const { error } = await supabase.rpc("app_update_cycle_preferences", {
      p_cycle_length: cycle.cycleLengthDays,
      p_period_length: cycle.periodLengthDays,
      p_luteal_phase: cycle.lutealPhaseDays,
      p_regularity: cycle.regularity,
    });
    check(error);
  },

  async updateUnits(units: UnitPreferences) {
    const { error } = await supabase.rpc("app_update_units", {
      p_weight: units.weight,
      p_height: units.height,
      p_temperature: units.temperature,
    });
    check(error);
  },
};
