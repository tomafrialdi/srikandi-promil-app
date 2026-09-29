import { Minus, Plus } from "phosphor-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius } from "@/constants/theme";

interface ValueStepperProps {
  onDecrease: () => void;
  onIncrease: () => void;
  children: ReactNode;
}

/** Big centered value with round minus / plus buttons on each side. */
export function ValueStepper({ onDecrease, onIncrease, children }: ValueStepperProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        onPress={onDecrease}
        style={styles.button}
      >
        <Minus size={18} color={colors.ink} />
      </Pressable>
      <View style={styles.value}>{children}</View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase"
        onPress={onIncrease}
        style={styles.button}
      >
        <Plus size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 10,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { alignItems: "center", gap: 2 },
});
