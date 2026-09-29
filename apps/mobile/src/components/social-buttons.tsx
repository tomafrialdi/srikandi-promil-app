import { AppleLogo, GoogleLogo } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

export type SocialProvider = "google" | "apple";

/** Google / Apple buttons shown on sign-up and log-in. */
export function SocialButtons({ onPress }: { onPress: (provider: SocialProvider) => void }) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onPress("google")}
        style={styles.button}
      >
        <GoogleLogo size={19} color="#4285F4" />
        <Text style={styles.label}>Google</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onPress("apple")} style={styles.button}>
        <AppleLogo size={19} color={colors.ink} />
        <Text style={styles.label}>Apple</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
});
