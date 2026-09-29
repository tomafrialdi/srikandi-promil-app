import { request } from "@/utils/http";
import type { PartnerData } from "../types";
import type { PartnerApi } from "./partner-api";

export const httpPartnerApi: PartnerApi = {
  get: () => request<PartnerData>("/partner"),
  setSharing: (key, enabled) =>
    request<void>("/partner/sharing", { method: "PATCH", body: JSON.stringify({ key, enabled }) }),
  sendTips: () => request<void>("/partner/tips", { method: "POST" }),
};
