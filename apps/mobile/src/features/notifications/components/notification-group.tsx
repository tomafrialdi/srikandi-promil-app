import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { AppNotification, NotificationGroup as Group } from "../types";
import { formatNotificationTime } from "../utils/group-notifications";
import { NotificationItem } from "./notification-item";

interface NotificationGroupProps {
  group: Group;
  /** Shows "Mark all as read" on the right of the title. */
  onMarkAllRead?: () => void;
  onItemPress: (notification: AppNotification) => void;
  onCtaPress?: (cta: NonNullable<AppNotification["cta"]>) => void;
}

export function NotificationGroup({ group, onMarkAllRead, onItemPress, onCtaPress }: NotificationGroupProps) {
  return (
    <View style={styles.group}>
      <View style={styles.head}>
        <Text style={styles.title}>{group.title}</Text>
        {onMarkAllRead ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onMarkAllRead}>
            <Text style={styles.action}>Mark all as read</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.list}>
        {group.items.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            timeLabel={formatNotificationTime(n.createdAt, group.key)}
            onPress={() => onItemPress(n)}
            onCtaPress={onCtaPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 18 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
  },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  action: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  list: { gap: 8 },
});
