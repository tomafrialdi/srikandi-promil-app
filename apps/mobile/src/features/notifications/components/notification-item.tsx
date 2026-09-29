import { ArrowRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, tones } from "@/constants/theme";
import { NOTIFICATION_ICONS } from "../icons";
import { FALLBACK_TYPE_STYLE, NOTIFICATION_TYPES } from "../notification-types";
import type { AppNotification } from "../types";

interface NotificationItemProps {
  notification: AppNotification;
  /** Time label already formatted for the group ("07:00", "Mon", ...). */
  timeLabel: string;
  onPress: () => void;
  onCtaPress?: (cta: NonNullable<AppNotification["cta"]>) => void;
}

/** One row: unread ones sit on a white card with a dot, read ones are flat. */
export function NotificationItem({ notification, timeLabel, onPress, onCtaPress }: NotificationItemProps) {
  const { icon, tone } = NOTIFICATION_TYPES[notification.type] ?? FALLBACK_TYPE_STYLE;
  const ItemIcon = NOTIFICATION_ICONS[icon];
  const { bg, fg } = tones[tone];
  const { cta, read } = notification;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, read ? styles.cardRead : styles.cardUnread]}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <ItemIcon size={17} color={fg} />
      </View>

      <View style={[styles.text, cta ? styles.textWithCta : null]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.time}>{timeLabel}</Text>
        </View>
        <Text style={styles.body}>{notification.body}</Text>
        {cta ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onCtaPress?.(cta)}
            style={styles.cta}
          >
            <Text style={styles.ctaLabel}>{cta.label}</Text>
            <ArrowRight size={12} color={colors.white} />
          </Pressable>
        ) : null}
      </View>

      {read ? null : <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardUnread: { backgroundColor: colors.card, borderColor: colors.border },
  cardRead: { backgroundColor: "transparent", borderColor: "transparent" },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 3 },
  textWithCta: { gap: 6 },
  titleRow: { flexDirection: "row", gap: 8 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  time: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
  body: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  ctaLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  dot: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
