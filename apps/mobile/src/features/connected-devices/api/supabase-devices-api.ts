import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import { DEVICE_CATALOG } from "../data/device-catalog";
import type { DeviceKind, DevicePreferenceKey, DevicesData } from "../types";
import { HealthStoreError, requestHealthAccess } from "../utils/health-store";
import type { DevicesApi } from "./devices-api";

interface DevicesRow {
  connected: { kind: DeviceKind; note: string | null; connectedAt: string; lastSyncAt: string | null }[];
  preferences: DevicesData["preferences"];
}

async function call(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

/** Catalog entries that apply to this phone (Apple Health only on iOS, Health Connect only on Android). */
const forThisPlatform = DEVICE_CATALOG.filter((d) => !d.platform || d.platform === Platform.OS);

export const supabaseDevicesApi: DevicesApi = {
  async get(): Promise<DevicesData> {
    const row = (await call("app_devices_get")) as DevicesRow;
    const connectedKinds = new Set(row.connected.map((c) => c.kind));
    const strip = ({ platform: _platform, ...device }: (typeof DEVICE_CATALOG)[number]) => device;

    return {
      // Nothing is imported yet, so there is no sync to report.
      syncSummary: null,
      connected: forThisPlatform.filter((d) => connectedKinds.has(d.id)).map(strip),
      available: forThisPlatform.filter((d) => !connectedKinds.has(d.id)).map(strip),
      preferences: row.preferences,
    };
  },

  async connect(deviceId) {
    const entry = DEVICE_CATALOG.find((d) => d.id === deviceId);
    if (!entry || entry.comingSoon) throw new HealthStoreError(`${entry?.name ?? "This device"} isn't available yet.`);
    const { note } = await requestHealthAccess();
    await call("app_device_connect", { p_kind: deviceId, p_note: note });
  },

  async disconnect(deviceId) {
    await call("app_device_disconnect", { p_kind: deviceId });
  },

  async setPreference(key: DevicePreferenceKey, enabled: boolean) {
    await call("app_devices_set_pref", { p_key: key, p_enabled: enabled });
  },
};
