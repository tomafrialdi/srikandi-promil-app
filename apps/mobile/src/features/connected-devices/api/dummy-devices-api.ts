import { delay } from "@/utils/http";
import type { DevicePreferenceKey, DevicesData } from "../types";
import type { DevicesApi } from "./devices-api";

let data: DevicesData = {
  syncSummary: {
    title: "Temperature synced automatically",
    description: "Last sync 06:12 today from Oura Ring · 36.6°C",
  },
  connected: [
    { id: "oura", name: "Oura Ring", description: "Skin temperature, sleep", icon: "ring" },
    { id: "apple-health", name: "Apple Health", description: "Cycle, steps, heart rate", icon: "heart-pulse" },
  ],
  available: [
    { id: "bt-thermometer", name: "Bluetooth thermometer", description: "Tempdrop, Femometer & more", icon: "thermometer" },
    { id: "hormone-monitor", name: "Hormone monitor", description: "Mira, Inito — LH, E3G, PdG", icon: "test-tube" },
    { id: "google-fit", name: "Google Fit", description: "Activity & sleep", icon: "pulse" },
    { id: "smartwatch", name: "Smartwatch", description: "Samsung, Garmin, Fitbit", icon: "watch" },
  ],
  preferences: { autoImportTemperature: true, askBeforeOverwrite: true },
};

/** Number of connected devices, for the Settings row while there is no backend. */
export const dummyConnectedCount = () => data.connected.length;

export const dummyDevicesApi: DevicesApi = {
  async get() {
    await delay(150);
    return data;
  },
  async connect(deviceId) {
    await delay(400);
    const device = data.available.find((d) => d.id === deviceId);
    if (!device) return;
    data = {
      ...data,
      connected: [...data.connected, device],
      available: data.available.filter((d) => d.id !== deviceId),
    };
  },
  async setPreference(key: DevicePreferenceKey, enabled: boolean) {
    await delay(80);
    data = { ...data, preferences: { ...data.preferences, [key]: enabled } };
  },
};
