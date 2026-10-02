/** Filter tabs on the screen. "all" is client-side only. */
export type NotificationCategory = "cycle" | "reminders" | "partner" | "community" | "updates";
export type NotificationFilter = "all" | NotificationCategory;

/** Notification as the backend sends it (snake_case, ISO dates). Keep in sync with the API. */
export interface NotificationDto {
  id: string;
  /** Machine name, e.g. "fertile_window_open". Icon and color are derived client-side. */
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  created_at: string;
  /** null = unread. */
  read_at: string | null;
  cta: { label: string; route: string } | null;
}

export interface NotificationSettingsDto {
  discreet_mode: boolean;
}

/** What the UI works with. Built from `NotificationDto` by `mapNotification`. */
export interface AppNotification {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: Date;
  read: boolean;
  cta: { label: string; route: string } | null;
}

export interface NotificationSettings {
  discreetMode: boolean;
}

export interface NotificationGroup {
  key: "today" | "yesterday" | "earlier";
  title: string;
  items: AppNotification[];
}
