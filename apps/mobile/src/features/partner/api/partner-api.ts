import { supabasePartnerApi } from "./supabase-partner-api";
import type { PartnerData, ShareKey } from "../types";

/**
 * What the Partner screen needs from the backend (Supabase RPCs `app_partner_*`).
 * Account linking isn't built yet: a partner is a name plus what the user chooses to share.
 */
export interface PartnerApi {
  get(): Promise<PartnerData>;
  /** Adds the partner, or renames the existing one. */
  save(name: string): Promise<void>;
  remove(): Promise<void>;
  setSharing(key: ShareKey, enabled: boolean): Promise<void>;
  /** Tips go out through the system share sheet; there is no server-side delivery yet. */
  sendTips(): Promise<void>;
}

export const partnerApi: PartnerApi = supabasePartnerApi;
