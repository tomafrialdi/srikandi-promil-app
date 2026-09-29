import dummy from "./dummy-notifications.json";
import type { NotificationDto, NotificationSettingsDto } from "../types";
import type { NotificationsApi } from "./notifications-api";
import { mapNotification, mapSettings } from "./mappers";

/** Dummy rows use `days_ago` + `time` so Today / Yesterday / Earlier always show; converted to real DTOs below. */
interface DummyRow extends Omit<NotificationDto, "created_at" | "read_at"> {
  days_ago: number;
  time: string;
  read: boolean;
}

function toDto(row: DummyRow): NotificationDto {
  const { days_ago, time, read, ...rest } = row;
  const [hours, minutes] = time.split(":").map(Number);
  const created = new Date();
  created.setDate(created.getDate() - days_ago);
  created.setHours(hours, minutes, 0, 0);
  return { ...rest, created_at: created.toISOString(), read_at: read ? created.toISOString() : null };
}

// In-memory store so read state survives navigating away and back (until the app restarts).
let store: NotificationDto[] | null = null;
const rows = () => (store ??= (dummy.notifications as DummyRow[]).map(toDto));

const delay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const dummyNotificationsApi: NotificationsApi = {
  async list() {
    await delay();
    return rows().map(mapNotification);
  },
  async markRead(id) {
    await delay(80);
    store = rows().map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n));
  },
  async markAllRead() {
    await delay(80);
    store = rows().map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
  },
  async getSettings() {
    await delay(80);
    return mapSettings(dummy.settings as NotificationSettingsDto);
  },
};
