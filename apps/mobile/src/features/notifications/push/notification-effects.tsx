import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { useOpenLink } from "@/features/content/hooks/use-open-link";
import { useLogging } from "@/features/logging/context/logging-context";
import { supabase } from "@/lib/supabase";
import { syncReminders } from "./reminders";
import { syncPush } from "./push-token";

// A notification that arrives while the app is open still shows as a banner, and joins the list.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Keeps notifications working while the user is signed in; renders nothing.
 *  - registers the phone for push (without asking: the permission prompt comes from a screen the user chose)
 *  - plans the local reminders, and replans after logging, after returning to the app and when settings change
 *  - opens the right screen when a notification is tapped, and marks it read
 */
export function NotificationEffects() {
  const { version } = useLogging();
  const openLink = useOpenLink();

  // Once per sign-in and each time the app comes back to the foreground.
  useEffect(() => {
    const refresh = () => {
      syncPush({ ask: false }).then(() => syncReminders());
    };
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, []);

  // Logging can move the predicted dates, so reminders follow.
  useEffect(() => {
    syncReminders();
  }, [version]);

  // Taps, including the one that launched the app from a closed state.
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!response) return;
    const key = response.notification.request.identifier + response.actionIdentifier;
    if (handled.current === key) return;
    handled.current = key;

    const data = response.notification.request.content.data as { notificationId?: string; deepLink?: string } | undefined;
    if (data?.notificationId) supabase.rpc("app_notification_read", { p_id: data.notificationId }).then(() => undefined);
    if (data?.deepLink) openLink(data.deepLink);
  }, [response, openLink]);

  return null;
}
