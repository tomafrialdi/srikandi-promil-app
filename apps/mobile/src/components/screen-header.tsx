import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/back-button";
import { colors, fonts } from "@/constants/theme";

interface ScreenHeaderProps {
  title: string;
  /** Right-hand action (an `IconButton`). Leave empty to keep the title centered. */
  right?: ReactNode;
}

/** Back button, centered title, and an optional action on the right. */
export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <BackButton />
      <Text style={styles.title}>{title}</Text>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  spacer: { width: 40, height: 40 },
});
