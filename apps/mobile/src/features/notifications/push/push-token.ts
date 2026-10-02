import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

export type PushPermission = "granted" | "denied" | "undetermined";

export interface PushStatus {
  permission: PushPermission;
  /** False once the user has refused twice: only the phone's Settings can turn it on. */
  canAskAgain: boolean;
}

/** Android needs a channel before it shows anything (and before a push token can be requested). */
export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Updates",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getPushStatus(): Promise<PushStatus> {
  const result = await Notifications.getPermissionsAsync();
  const canAskAgain = result.canAskAgain !== false;
  // "undetermined" also covers a refusal the system still lets us ask about again.
  return { permission: result.granted ? "granted" : canAskAgain ? "undetermined" : "denied", canAskAgain };
}

let registeredToken: string | null = null;

/**
 * Registers this phone for push, if allowed. Silent when it can't: simulators have no push token, and
 * until Firebase (Android) / APNs (iOS) credentials are set up the token request itself fails. The inbox
 * and the local reminders don't depend on it.
 */
async function registerToken(): Promise<void> {
  if (!Device.isDevice) return;
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (token === registeredToken) return;
    const { error } = await supabase.rpc("app_push_token_register", {
      p_token: token,
      p_platform: Platform.OS === "ios" ? "ios" : "android",
    });
    if (!error) registeredToken = token;
  } catch (e) {
    if (__DEV__) console.warn("[push] no push token yet:", e instanceof Error ? e.message : e);
  }
}

/**
 * Makes the phone ready for notifications: channels, the permission (asked only when `ask` is true, so the
 * system prompt appears at a moment the user chose) and the push token. Returns the permission afterwards.
 */
export async function syncPush({ ask }: { ask: boolean }): Promise<PushStatus> {
  await ensureAndroidChannels();
  let status = await getPushStatus();
  if (status.permission !== "granted" && ask && status.canAskAgain) {
    await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
    status = await getPushStatus();
  }
  if (status.permission === "granted") await registerToken();
  return status;
}

/** On sign-out: this phone stops receiving this account's pushes. */
export async function unregisterPushToken(): Promise<void> {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  await supabase.rpc("app_push_token_remove", { p_token: token });
}
