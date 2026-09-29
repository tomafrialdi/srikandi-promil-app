import type { AppNotification, NotificationGroup } from "../types";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const TITLES: Record<NotificationGroup["key"], string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

/** Newest first, split into Today / Yesterday / Earlier. Empty groups are dropped. */
export function groupNotifications(items: AppNotification[], now = new Date()): NotificationGroup[] {
  const today = startOfDay(now);
  const groups: Record<NotificationGroup["key"], AppNotification[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  [...items]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .forEach((n) => {
      const day = startOfDay(n.createdAt);
      if (day >= today) groups.today.push(n);
      else if (day >= today - DAY_MS) groups.yesterday.push(n);
      else groups.earlier.push(n);
    });

  return (Object.keys(groups) as NotificationGroup["key"][])
    .filter((key) => groups[key].length > 0)
    .map((key) => ({ key, title: TITLES[key], items: groups[key] }));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "07:00" for today / yesterday, "Mon" within the last week, "12 May" beyond. */
export function formatNotificationTime(date: Date, group: NotificationGroup["key"], now = new Date()): string {
  if (group !== "earlier") return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  return daysAgo < 7 ? WEEKDAYS[date.getDay()] : `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
