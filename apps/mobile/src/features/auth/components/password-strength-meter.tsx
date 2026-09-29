import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { passwordStrength } from "../utils/validation";

const TONE = [colors.border, colors.error, colors.warning, colors.success, colors.success] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  if (score === 0) return null;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[styles.bar, { backgroundColor: bar <= score ? TONE[score] : colors.border }]}
        />
      ))}
      <Text style={[styles.label, { color: TONE[score] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: radius.pill },
  label: { fontFamily: fonts.bold, fontSize: 11 },
});
