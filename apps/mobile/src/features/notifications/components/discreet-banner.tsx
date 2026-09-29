import { EyeSlash } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

/** Reminds the user that lock-screen previews are hidden. */
export function DiscreetBanner() {
  return (
    <View style={styles.banner}>
      <EyeSlash size={14} color={colors.inkMuted} />
      <Text style={styles.text}>
        Discreet mode on — your lock screen only shows “Daily reminder”.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
});
