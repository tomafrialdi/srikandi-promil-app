import { supabase } from "@/lib/supabase";
import type { NotificationDto } from "../types";
import type { NotificationsApi } from "./notifications-api";
import { mapNotification, mapSettings } from "./mappers";

async function call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const supabaseNotificationsApi: NotificationsApi = {
  async get() {
    const row = await call<{ items: NotificationDto[]; discreetMode: boolean }>("app_notifications_get", { p_limit: 60 });
    return { items: row.items.map(mapNotification), settings: mapSettings({ discreet_mode: row.discreetMode }) };
  },
  async markRead(id) {
    await call("app_notification_read", { p_id: id });
  },
  async markAllRead() {
    await call("app_notifications_read_all");
  },
  async unreadCount() {
    return call<number>("app_notifications_unread_count");
  },
};
