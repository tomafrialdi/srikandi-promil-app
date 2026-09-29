import { Bell } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { formatToday, greetingFor } from "../utils/greeting";

interface GreetingHeaderProps {
  name: string;
  hasUnread: boolean;
  onBellPress?: () => void;
  /** Injectable for tests / previews; defaults to now. */
  now?: Date;
}

export function GreetingHeader({ name, hasUnread, onBellPress, now = new Date() }: GreetingHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.greeting}>
          {greetingFor(now)}, {name}
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
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
