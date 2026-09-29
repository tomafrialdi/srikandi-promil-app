import { USE_DUMMY_API } from "@/config/api";
import type { PrivacySettings, PrivacyToggleKey } from "../types";
import { dummyPrivacyApi } from "./dummy-privacy-api";
import { httpPrivacyApi } from "./http-privacy-api";

/**
 * What the Privacy & security screen needs from the backend.
 *
 *   GET    /privacy              -> PrivacySettings
 *   PATCH  /privacy              body: { key, enabled } -> 204
 *   POST   /account/data-export  -> 204   (emails the user a download link)
 *   DELETE /account/data         -> 204   (permanently erases the account's data)
 */
export interface PrivacyApi {
  get(): Promise<PrivacySettings>;
  setToggle(key: PrivacyToggleKey, enabled: boolean): Promise<void>;
  requestDataExport(): Promise<void>;
  deleteAllData(): Promise<void>;
}

export const privacyApi: PrivacyApi = USE_DUMMY_API ? dummyPrivacyApi : httpPrivacyApi;
