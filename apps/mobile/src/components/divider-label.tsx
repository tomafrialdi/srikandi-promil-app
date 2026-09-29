import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

/** Horizontal rule with a centered label, e.g. "or sign up with email". */
export function DividerLabel({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkFaint },
});
