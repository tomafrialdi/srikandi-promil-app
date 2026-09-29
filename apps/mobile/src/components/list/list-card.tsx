import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

/** White rounded card that stacks rows and draws a divider between them. */
export function ListCard({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.card}>
      {rows.map((row, i) => (
        <View key={i} style={i < rows.length - 1 ? styles.divider : undefined}>
          {row}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
