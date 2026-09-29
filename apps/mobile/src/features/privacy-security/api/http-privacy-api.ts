import { request } from "@/utils/http";
import type { PrivacySettings } from "../types";
import type { PrivacyApi } from "./privacy-api";

export const httpPrivacyApi: PrivacyApi = {
  get: () => request<PrivacySettings>("/privacy"),
  setToggle: (key, enabled) =>
    request<void>("/privacy", { method: "PATCH", body: JSON.stringify({ key, enabled }) }),
  requestDataExport: () => request<void>("/account/data-export", { method: "POST" }),
  deleteAllData: () => request<void>("/account/data", { method: "DELETE" }),
};
