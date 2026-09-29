export type DeviceIconName = "ring" | "heart-pulse" | "thermometer" | "test-tube" | "pulse" | "watch";

export interface Device {
  id: string;
  name: string;
  description: string;
  icon: DeviceIconName;
}

export type DevicePreferenceKey = "autoImportTemperature" | "askBeforeOverwrite";

/** Everything the Connected devices screen shows. The backend returns this shape. */
export interface DevicesData {
  /** Green card at the top, e.g. last automatic sync. Null hides it. */
  syncSummary: { title: string; description: string } | null;
  connected: Device[];
  available: Device[];
  preferences: Record<DevicePreferenceKey, boolean>;
}
