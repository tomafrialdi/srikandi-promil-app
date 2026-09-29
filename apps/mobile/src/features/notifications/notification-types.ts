import type { Tone } from "@/constants/theme";

export type NotificationIconName =
  | "sparkle"
  | "users"
  | "chat"
  | "pill"
  | "thermometer"
  | "calendar-check"
  | "file-text"
  | "book-open"
  | "bell";

interface NotificationTypeStyle {
  icon: NotificationIconName;
  tone: Tone;
}

/** Look of each backend `type`. Add a line when the backend introduces a new type. */
export const NOTIFICATION_TYPES: Record<string, NotificationTypeStyle> = {
  fertile_window_open: { icon: "sparkle", tone: "primary" },
  partner_hug: { icon: "users", tone: "info" },
  community_reply: { icon: "chat", tone: "success" },
  medication_reminder: { icon: "pill", tone: "warning" },
  temperature_synced: { icon: "thermometer", tone: "error" },
  appointment_reminder: { icon: "calendar-check", tone: "info" },
  cycle_report_ready: { icon: "file-text", tone: "neutral" },
  new_article: { icon: "book-open", tone: "neutral" },
};

/** Used for any type not listed above, so a new backend type never breaks the screen. */
export const FALLBACK_TYPE_STYLE: NotificationTypeStyle = { icon: "bell", tone: "neutral" };
