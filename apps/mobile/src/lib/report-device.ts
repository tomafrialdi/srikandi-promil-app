import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { supabase } from "./supabase";

/**
 * Tells the backend what this app runs on (platform, app version, phone model), so the console's
 * "Devices & integrations" shows real values. Best effort: a failure must never block the app.
 */
export async function reportDevice(): Promise<void> {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  await supabase.rpc("app_report_device", {
    p_platform: platform,
    p_app_version: Constants.expoConfig?.version ?? null,
    p_device_model: Device.modelName ?? null,
    // Campaigns go out at the user's local time.
    p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
  });
}
