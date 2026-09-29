import type { Icon } from "phosphor-react-native";
import { Pressable, StyleSheet } from "react-native";

import { colors, radius } from "@/constants/theme";

interface IconButtonProps {
  icon: Icon;
  label: string;
  onPress?: () => void;
  /** Fill the icon (e.g. an active bookmark). */
  filled?: boolean;
  /** "overlay" is a translucent white circle for use on top of images. */
  variant?: "default" | "overlay";
}

/** 40px round icon button (share, bookmark, settings ...). */
export function IconButton({ icon: ButtonIcon, label, onPress, filled, variant = "default" }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, variant === "overlay" && styles.overlay]}
    >
      <ButtonIcon size={18} weight={filled ? "fill" : "regular"} color={colors.ink} />
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
  overlay: { borderWidth: 0, backgroundColor: "#FFFFFFE6" },
});
