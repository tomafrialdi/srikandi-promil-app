import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { notificationsApi } from "../api/notifications-api";
import type {
  AppNotification,
  NotificationFilter,
  NotificationSettings,
} from "../types";
import { groupNotifications } from "../utils/group-notifications";

/**
 * Loads notifications + settings, applies the category filter locally, and
 * updates read state optimistically (rolled back if the request fails).
 */
export function useNotifications() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  // Reload every time the screen comes into view, so what arrived meanwhile shows up.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      notificationsApi
        .get()
        .then(({ items: list, settings: s }) => {
          if (cancelled) return;
          setItems(list);
          setSettings(s);
        })
        .catch(() => {
          // Keep what is on screen; the next visit retries.
          if (!cancelled) setItems((cur) => cur ?? []);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const groups = useMemo(() => {
    if (!items) return [];
    const visible = filter === "all" ? items : items.filter((n) => n.category === filter);
    return groupNotifications(visible);
  }, [items, filter]);

  const markRead = useCallback(
    async (id: string) => {
      const previous = items;
      setItems((cur) => cur?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? cur);
      try {
        await notificationsApi.markRead(id);
      } catch {
        setItems(previous);
      }
    },
    [items],
  );

  const markAllRead = useCallback(async () => {
    const previous = items;
    setItems((cur) => cur?.map((n) => ({ ...n, read: true })) ?? cur);
    try {
      await notificationsApi.markAllRead();
    } catch {
      setItems(previous);
    }
  }, [items]);

  return {
    loading: items === null,
    groups,
    settings,
    filter,
    setFilter,
    hasUnread: !!items?.some((n) => !n.read),
    markRead,
    markAllRead,
  };
}
