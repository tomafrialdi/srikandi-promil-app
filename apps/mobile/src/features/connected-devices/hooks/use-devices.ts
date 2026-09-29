import { useCallback, useEffect, useState } from "react";

import { devicesApi } from "../api/devices-api";
import type { DevicePreferenceKey, DevicesData } from "../types";

/** Loads devices; connecting moves a device to "Connected", preference toggles are optimistic. */
export function useDevices() {
  const [data, setData] = useState<DevicesData | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    devicesApi.get().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    setConnectingId(deviceId);
    try {
      await devicesApi.connect(deviceId);
      setData((cur) => {
        const device = cur?.available.find((d) => d.id === deviceId);
        if (!cur || !device) return cur;
        return {
          ...cur,
          connected: [...cur.connected, device],
          available: cur.available.filter((d) => d.id !== deviceId),
        };
      });
    } finally {
      setConnectingId(null);
    }
  }, []);

  const setPreference = useCallback(async (key: DevicePreferenceKey, enabled: boolean) => {
    const apply = (value: boolean) =>
      setData((cur) => (cur ? { ...cur, preferences: { ...cur.preferences, [key]: value } } : cur));
    apply(enabled);
    try {
      await devicesApi.setPreference(key, enabled);
    } catch {
      apply(!enabled);
    }
  }, []);

  return { data, connectingId, connect, setPreference };
}
