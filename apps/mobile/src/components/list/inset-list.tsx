import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

/** White card with 16px side padding; each child is a row separated by a hairline. */
export function InsetList({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.card}>
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i < rows.length - 1 && styles.divider]}>
          {row}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
