import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

/**
 * Error value that means "this required field is empty".
 * The shell shows it on the label row (top right); any other error goes below the field.
 */
export const REQUIRED_MESSAGE = "Required";

interface FieldShellProps {
  label: string;
  error?: string;
  children: ReactNode;
}

/** Label row (with "Required" on the right), field, and any other error below — shared by every field type. */
export function FieldShell({ label, error, children }: FieldShellProps) {
  const isRequiredError = error === REQUIRED_MESSAGE;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {isRequiredError ? <Text style={styles.error}>{REQUIRED_MESSAGE}</Text> : null}
      </View>
      {children}
      {error && !isRequiredError ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  label: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error },
});
