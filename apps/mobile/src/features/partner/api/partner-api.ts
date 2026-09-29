import { USE_DUMMY_API } from "@/config/api";
import type { PartnerData, ShareKey } from "../types";
import { dummyPartnerApi } from "./dummy-partner-api";
import { httpPartnerApi } from "./http-partner-api";

/**
 * What the Partner screen needs from the backend.
 *
 *   GET   /partner          -> PartnerData
 *   PATCH /partner/sharing  body: { key, enabled } -> 204
 *   POST  /partner/tips     -> 204   (emails / messages the tips to the partner)
 */
export interface PartnerApi {
  get(): Promise<PartnerData>;
  setSharing(key: ShareKey, enabled: boolean): Promise<void>;
  sendTips(): Promise<void>;
}

export const partnerApi: PartnerApi = USE_DUMMY_API ? dummyPartnerApi : httpPartnerApi;
