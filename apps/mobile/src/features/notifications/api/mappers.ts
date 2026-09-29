import type {
  AppNotification,
  NotificationDto,
  NotificationSettings,
  NotificationSettingsDto,
} from "../types";

export function mapNotification(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    category: dto.category,
    title: dto.title,
    body: dto.body,
    createdAt: new Date(dto.created_at),
    read: dto.read_at !== null,
    cta: dto.cta,
  };
}

export function mapSettings(dto: NotificationSettingsDto): NotificationSettings {
  return { discreetMode: dto.discreet_mode };
}
