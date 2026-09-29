import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import { ListCard } from "./list-card";

/** Grey section title above a `ListCard`. Pass `ListRow` / `ToggleRow` as children. */
export function ListSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <ListCard>{children}</ListCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkFaint },
});
