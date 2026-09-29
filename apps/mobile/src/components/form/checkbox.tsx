import { Check } from "phosphor-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Box size in px. */
  size?: number;
  /** Text (or any content) shown beside the box; tapping it toggles too. */
  children?: ReactNode;
}

export function Checkbox({ checked, onChange, size = 20, children }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: size * 0.3 },
          checked ? styles.boxChecked : styles.boxUnchecked,
        ]}
      >
        {checked ? <Check size={size * 0.65} weight="bold" color={colors.white} /> : null}
      </View>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  box: { alignItems: "center", justifyContent: "center", borderWidth: 1 },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxUnchecked: { backgroundColor: colors.card, borderColor: colors.border },
});
