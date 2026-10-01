import { trackingModeLabel } from "@/features/tracking-mode/api/supabase-tracking-mode-api";
import { supabase } from "@/lib/supabase";
import type { CyclePreferences, Profile, SettingsSummary, SettingsValue, SettingsValueKey, UnitPreferences } from "../types";
import { unitsLabel } from "../utils/units";
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
  "avatar_url",
  "tracking_mode",
].join(",");

/** The phone's local date as "YYYY-MM-DD" (the server doesn't know the user's time zone). */
function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Live values for the fertility-journey rows; a failed lookup just leaves that row without a value. */
async function fertilityJourneyValues(): Promise<Partial<Record<SettingsValueKey, SettingsValue>>> {
  const [treatment, partner] = await Promise.all([
    supabase.rpc("app_treatment_get", { p_today: localToday() }),
    supabase.rpc("app_partner_get"),
  ]);

  const values: Partial<Record<SettingsValueKey, SettingsValue>> = {};
  const program = treatment.data?.program as { title: string; dayLabel: string } | null | undefined;
  if (program) values.treatment = { text: `${program.title.split(" · ")[0]} · ${program.dayLabel}` };
  const name = (partner.data?.partner as { name: string } | null | undefined)?.name;
  values.partner = name ? { text: name } : { text: "Not added" };
  return values;
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const supabaseSettingsApi: SettingsApi = {
  ...dummySettingsApi,

  async getSummary(): Promise<SettingsSummary> {
    const [dummy, { data, error }, journey] = await Promise.all([
      dummySettingsApi.getSummary(),
      supabase.from("app_users").select(COLUMNS).single(),
      fertilityJourneyValues(),
    ]);
    check(error);
    const row = data as unknown as Record<string, any>;

    const units: UnitPreferences = {
      weight: row.unit_weight,
      height: row.unit_height,
      temperature: row.unit_temperature,
    };
    // Rows that now come from Supabase replace the dummy ones; no program/partner means no value.
    const { treatment: _dummyTreatment, partner: _dummyPartner, ...dummyValues } = dummy.values;
    return {
      ...dummy,
      values: {
        ...dummyValues,
        ...journey,
        trackingMode: { text: trackingModeLabel(row.tracking_mode) },
        units: { text: unitsLabel(units) },
      },
      profile: {
        name: row.full_name,
        email: row.email,
        birthDate: row.birth_date ?? FALLBACK.birthDate,
        heightCm: row.height_cm ?? FALLBACK.heightCm,
        weightKg: Number(row.weight_kg ?? FALLBACK.weightKg),
        avatarUrl: row.avatar_url ?? null,
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

  async updateAvatar(url: string | null) {
    const { error } = await supabase.rpc("app_update_avatar", { p_url: url });
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
