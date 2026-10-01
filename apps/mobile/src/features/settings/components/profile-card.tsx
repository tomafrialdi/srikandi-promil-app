import { CaretRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { colors, fonts } from "@/constants/theme";
import { ikUrl } from "@/lib/imagekit";

interface ProfileCardProps {
  name: string;
  email: string;
  avatarUrl?: string | null;
  onPress?: () => void;
}

/** Pink card with the avatar (photo or initials), name and email. Opens personal information. */
export function ProfileCard({ name, email, avatarUrl, onPress }: ProfileCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Avatar name={name} imageUrl={ikUrl(avatarUrl, { w: 160, h: 160 })} size={56} />
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
  text: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  email: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
});
