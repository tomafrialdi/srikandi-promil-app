import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, fonts } from "@/constants/theme";

interface ButtonPrimaryProps {
  label: string;
  onPress?: () => void;
  backgroundColor?: string;
  labelColor?: string;
  style?: ViewStyle;
}

export function ButtonPrimary({
  label,
  onPress,
  backgroundColor = colors.primary,
  labelColor = colors.white,
  style,
}: ButtonPrimaryProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});
