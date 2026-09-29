import type { Icon } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

interface ButtonOutlineProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Smaller padding, used inside cards. */
  compact?: boolean;
  icon?: Icon;
  style?: ViewStyle;
}

/** Secondary button: pill with a border and no fill. */
export function ButtonOutline({ label, onPress, disabled, compact, icon: LeadingIcon, style }: ButtonOutlineProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compact : styles.regular,
        { opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {LeadingIcon ? <LeadingIcon size={16} color={colors.ink} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  regular: { paddingVertical: 16, paddingHorizontal: 24 },
  compact: { paddingVertical: 10, paddingHorizontal: 16 },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
});
