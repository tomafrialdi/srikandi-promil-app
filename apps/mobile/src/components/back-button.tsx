import { router } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { Pressable, StyleSheet } from "react-native";

import { colors, radius } from "@/constants/theme";

/** Round back button used in screen headers. Defaults to `router.back()`. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress ?? (() => router.back())}
      style={styles.button}
    >
      <ArrowLeft size={18} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
});
