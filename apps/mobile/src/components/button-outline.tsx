import type { Icon } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

interface ButtonOutlineProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Smaller padding, used inside cards. */
  compact?: boolean;
  /** "danger" is red on a soft red fill (log out, delete ...). */
  tone?: "default" | "danger";
  icon?: Icon;
  style?: ViewStyle;
}

/** Secondary button: pill with a border and no fill. */
export function ButtonOutline({ label, onPress, disabled, compact, tone = "default", icon: LeadingIcon, style }: ButtonOutlineProps) {
  const danger = tone === "danger";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compact : styles.regular,
        danger && styles.danger,
        { opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {LeadingIcon ? <LeadingIcon size={16} color={danger ? colors.error : colors.ink} /> : null}
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
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
  danger: { borderColor: colors.errorSoft, backgroundColor: colors.errorSoft },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  labelDanger: { color: colors.error },
});
