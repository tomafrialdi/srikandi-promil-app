import type { AppNotification, NotificationSettings } from "../types";
import { supabaseNotificationsApi } from "./supabase-notifications-api";

/**
 * What the app needs from the backend for notifications (Supabase RPCs `app_notifications_*`).
 * The inbox holds what campaigns from the console delivered to this user; text is already in the
 * user's discreet wording when discreet mode is on.
 */
export interface NotificationsApi {
  /** Newest first, only what has already gone out. */
  get(): Promise<{ items: AppNotification[]; settings: NotificationSettings }>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  unreadCount(): Promise<number>;
}

export const notificationsApi: NotificationsApi = supabaseNotificationsApi;
