import type { AppNotification, NotificationSettings } from "../types";
import { USE_DUMMY_NOTIFICATIONS } from "./config";
import { dummyNotificationsApi } from "./dummy-notifications-api";
import { httpNotificationsApi } from "./http-notifications-api";

/**
 * What the app needs from the backend for notifications.
 *
 * Endpoints (see http-notifications-api.ts):
 *   GET  /notifications          -> { data: NotificationDto[] }   newest first
 *   POST /notifications/:id/read -> 204
 *   POST /notifications/read-all -> 204
 *   GET  /notification-settings  -> NotificationSettingsDto
 */
export interface NotificationsApi {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  getSettings(): Promise<NotificationSettings>;
}

/** The single switch between dummy data and the real backend. */
export const notificationsApi: NotificationsApi = USE_DUMMY_NOTIFICATIONS
  ? dummyNotificationsApi
  : httpNotificationsApi;
