import { Bell } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { colors, fonts, radius } from "@/constants/theme";
import { formatToday, greetingFor } from "../utils/greeting";

interface GreetingHeaderProps {
  /** Full name; the greeting uses the first word, the avatar the initials. */
  name: string;
  avatarUrl?: string | null;
  hasUnread: boolean;
  onAvatarPress?: () => void;
  onBellPress?: () => void;
  /** Injectable for tests / previews; defaults to now. */
  now?: Date;
}

/** Profile picture, greeting + date, and the notifications bell. Kept pinned by `HomeScreen`. */
export function GreetingHeader({
  name,
  avatarUrl,
  hasUnread,
  onAvatarPress,
  onBellPress,
  now = new Date(),
}: GreetingHeaderProps) {
  const firstName = name.trim().split(/\s+/)[0];

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onAvatarPress}>
        <Avatar name={name} imageUrl={avatarUrl} size={44} />
      </Pressable>

      <View style={styles.text}>
        <Text style={styles.greeting}>
          {firstName ? `${greetingFor(now)}, ${firstName}` : greetingFor(now)}
        </Text>
        <Text style={styles.date}>{formatToday(now)}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={onBellPress}
        style={styles.bell}
      >
        <Bell size={19} color={colors.ink} />
        {hasUnread ? <View style={styles.dot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1, gap: 2 },
  greeting: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  date: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
