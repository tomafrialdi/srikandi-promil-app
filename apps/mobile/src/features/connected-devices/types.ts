export type DeviceIconName = "ring" | "heart-pulse" | "thermometer" | "test-tube" | "pulse" | "watch";

/** Matches `user_integrations.kind` in the database. */
export type DeviceKind =
  | "apple_health"
  | "health_connect"
  | "oura"
  | "bt_thermometer"
  | "hormone_monitor"
  | "smartwatch";

export interface Device {
  id: DeviceKind;
  name: string;
  description: string;
  icon: DeviceIconName;
  /** Not connectable yet: shown with a "Soon" tag instead of a Connect button. */
  comingSoon?: boolean;
}

export type DevicePreferenceKey = "autoImportTemperature" | "askBeforeOverwrite";

/** Everything the Connected devices screen shows. The backend returns this shape. */
export interface DevicesData {
  /** Green card at the top, e.g. last automatic sync. Null hides it (no device has synced yet). */
  syncSummary: { title: string; description: string } | null;
  connected: Device[];
  available: Device[];
  preferences: Record<DevicePreferenceKey, boolean>;
}
