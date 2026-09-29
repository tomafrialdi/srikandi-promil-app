import type { NotificationDto, NotificationSettingsDto } from "../types";
import type { NotificationsApi } from "./notifications-api";
import { mapNotification, mapSettings } from "./mappers";

/**
 * Real backend implementation. Fill in `BASE_URL` / auth and it is ready.
 * TODO(backend): base URL from env, and attach the user's access token.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // TODO(backend): Authorization: `Bearer ${accessToken}`
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${path}`);
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const httpNotificationsApi: NotificationsApi = {
  async list() {
    const { data } = await request<{ data: NotificationDto[] }>("/notifications");
    return data.map(mapNotification);
  },
  markRead: (id) => request<void>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => request<void>("/notifications/read-all", { method: "POST" }),
  async getSettings() {
    return mapSettings(await request<NotificationSettingsDto>("/notification-settings"));
  },
};
