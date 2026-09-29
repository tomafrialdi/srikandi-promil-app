import { ArrowRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fonts } from "@/constants/theme";

/** Primary-colored text link with a trailing arrow, e.g. "View mood history →". */
export function LinkButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <ArrowRight size={14} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});
