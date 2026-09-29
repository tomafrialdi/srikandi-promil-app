import { request } from "@/utils/http";
import type { DevicesData } from "../types";
import type { DevicesApi } from "./devices-api";

export const httpDevicesApi: DevicesApi = {
  get: () => request<DevicesData>("/devices"),
  connect: (deviceId) => request<void>(`/devices/${deviceId}/connect`, { method: "POST" }),
  setPreference: (key, enabled) =>
    request<void>("/devices/preferences", { method: "PATCH", body: JSON.stringify({ key, enabled }) }),
};
