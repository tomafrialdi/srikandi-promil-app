import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

interface FieldShellProps {
  label: string;
  error?: string;
  children: ReactNode;
}

/** Label above, error below — shared by every field type. */
export function FieldShell({ label, error, children }: FieldShellProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error },
});
