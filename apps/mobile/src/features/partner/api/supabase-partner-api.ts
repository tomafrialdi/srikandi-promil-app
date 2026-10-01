import { fetchOwnProfile } from "@/features/profile/api/profile-api";
import { supabase } from "@/lib/supabase";
import { MONTH_NAMES } from "@/utils/calendar";
import { MALE_INSIGHT, PARTNER_TIPS } from "../data/partner-content";
import type { PartnerData, ShareKey } from "../types";
import type { PartnerApi } from "./partner-api";

interface PartnerRow {
  name: string;
  addedAt: string;
  sharing: PartnerData["sharing"];
}

const NO_SHARING: PartnerData["sharing"] = {
  fertileWindow: false,
  periodDates: false,
  testResults: false,
  mood: false,
  symptomsNotes: false,
};

async function call(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? "";
const initialOf = (name: string) => name.trim().charAt(0).toUpperCase();

export const supabasePartnerApi: PartnerApi = {
  async get(): Promise<PartnerData> {
    const [profile, result] = await Promise.all([
      fetchOwnProfile(),
      call("app_partner_get") as Promise<{ partner: PartnerRow | null }>,
    ]);
    const me = firstName(profile.fullName);
    const row = result.partner;

    if (!row) {
      return {
        me: { name: me, initial: initialOf(me) },
        partner: null,
        status: "",
        preview: { message: "" },
        sharing: NO_SHARING,
        maleInsight: MALE_INSIGHT,
        tips: PARTNER_TIPS,
      };
    }

    const added = new Date(row.addedAt);
    return {
      me: { name: me, initial: initialOf(me) },
      partner: { name: row.name, initial: initialOf(row.name) },
      status: `Added ${MONTH_NAMES[added.getMonth()]} ${added.getFullYear()} · account linking coming soon`,
      preview: { message: `${row.name} will see these updates once account linking is available.` },
      sharing: row.sharing,
      maleInsight: MALE_INSIGHT,
      tips: PARTNER_TIPS,
    };
  },

  async save(name) {
    await call("app_partner_save", { p_name: name });
  },
  async remove() {
    await call("app_partner_remove");
  },
  async setSharing(key: ShareKey, enabled: boolean) {
    await call("app_partner_set_sharing", { p_key: key, p_enabled: enabled });
  },
  async sendTips() {},
};
