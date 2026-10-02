import { useCallback, useEffect, useState } from "react";

import { devicesApi } from "../api/devices-api";
import type { DeviceKind, DevicePreferenceKey, DevicesData } from "../types";

/**
 * Loads devices. Connect / disconnect reload the list afterwards (the OS may refuse access,
 * so the screen never assumes success); preference toggles are optimistic.
 */
export function useDevices() {
  const [data, setData] = useState<DevicesData | null>(null);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<DeviceKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    devicesApi
      .get()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Runs a change for one device. Rejects with the reason so the screen can show it. */
  const change = useCallback(async (deviceId: DeviceKind, action: () => Promise<void>) => {
    setBusyId(deviceId);
    try {
      await action();
      setData(await devicesApi.get());
    } finally {
      setBusyId(null);
    }
  }, []);

  const connect = useCallback((id: DeviceKind) => change(id, () => devicesApi.connect(id)), [change]);
  const disconnect = useCallback((id: DeviceKind) => change(id, () => devicesApi.disconnect(id)), [change]);

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

  return { data, error, busyId, connect, disconnect, setPreference };
}
