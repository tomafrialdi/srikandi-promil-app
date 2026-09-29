import { USE_DUMMY_API } from "@/config/api";
import type { DevicePreferenceKey, DevicesData } from "../types";
import { dummyDevicesApi } from "./dummy-devices-api";
import { httpDevicesApi } from "./http-devices-api";

/**
 * What the Connected devices screen needs from the backend.
 *
 *   GET   /devices                -> DevicesData
 *   POST  /devices/:id/connect    -> 204   (the backend / OS handles pairing or OAuth)
 *   PATCH /devices/preferences    body: { key, enabled } -> 204
 */
export interface DevicesApi {
  get(): Promise<DevicesData>;
  connect(deviceId: string): Promise<void>;
  setPreference(key: DevicePreferenceKey, enabled: boolean): Promise<void>;
}

export const devicesApi: DevicesApi = USE_DUMMY_API ? dummyDevicesApi : httpDevicesApi;
