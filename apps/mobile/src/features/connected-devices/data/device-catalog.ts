import type { Device } from "../types";

export interface CatalogEntry extends Device {
  /** Only offered on this platform; omitted = both. */
  platform?: "ios" | "android";
}

/**
 * Every device the screen can show. Apple Health and Health Connect are real (read through the
 * OS); the rest need a vendor integration (OAuth / SDK) that isn't built yet.
 */
export const DEVICE_CATALOG: CatalogEntry[] = [
  {
    id: "apple_health",
    platform: "ios",
    name: "Apple Health",
    description: "Temperature & cycle data from your iPhone",
    icon: "heart-pulse",
  },
  {
    id: "health_connect",
    platform: "android",
    name: "Health Connect",
    description: "Temperature & cycle data from your phone",
    icon: "pulse",
  },
  { id: "oura", name: "Oura Ring", description: "Skin temperature, sleep", icon: "ring", comingSoon: true },
  {
    id: "bt_thermometer",
    name: "Bluetooth thermometer",
    description: "Tempdrop, Femometer & more",
    icon: "thermometer",
    comingSoon: true,
  },
  {
    id: "hormone_monitor",
    name: "Hormone monitor",
    description: "Mira, Inito — LH, E3G, PdG",
    icon: "test-tube",
    comingSoon: true,
  },
  {
    id: "smartwatch",
    name: "Smartwatch",
    description: "Samsung, Garmin, Fitbit",
    icon: "watch",
    comingSoon: true,
  },
];
