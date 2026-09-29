import { CaretRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { initials } from "@/utils/initials";

interface ProfileCardProps {
  name: string;
  email: string;
  onPress?: () => void;
}

/** Pink card with the avatar (initials), name and email. Opens personal information. */
export function ProfileCard({ name, email, onPress }: ProfileCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials(name)}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
      <CaretRight size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
  text: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  email: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
});
