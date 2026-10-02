import { supabaseDevicesApi } from "./supabase-devices-api";
import type { DeviceKind, DevicePreferenceKey, DevicesData } from "../types";

/**
 * What the Connected devices screen needs from the backend (Supabase RPCs `app_device*`).
 * The device catalog lives in the app; the database stores what is connected and the preferences.
 */
export interface DevicesApi {
  get(): Promise<DevicesData>;
  /** Asks the OS for access first, and records the connection only if that succeeded. */
  connect(deviceId: DeviceKind): Promise<void>;
  disconnect(deviceId: DeviceKind): Promise<void>;
  setPreference(key: DevicePreferenceKey, enabled: boolean): Promise<void>;
}

export const devicesApi: DevicesApi = supabaseDevicesApi;
