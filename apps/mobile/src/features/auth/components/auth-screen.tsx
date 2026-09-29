import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { colors, fonts } from "@/constants/theme";

interface AuthScreenProps {
  /** Gap between the stacked blocks in `children`. */
  gap?: number;
  children: ReactNode;
  /** Pinned to the bottom: usually the CTA and the switch link. */
  footer: ReactNode;
}

/** Shared shell for sign-up / verify / log-in: back button, scrollable body, pinned footer. */
export function AuthScreen({ gap = 22, children, footer }: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap }}>
            <View style={styles.header}>
              <BackButton />
            </View>
            {children}
          </View>
          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** "Already have an account? Log in" style row. */
export function SwitchLink({
  hint,
  action,
  onPress,
}: {
  hint: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchHint}>{hint}</Text>
      <Text accessibilityRole="link" onPress={onPress} style={styles.switchAction}>
        {action}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: 24,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footer: { alignItems: "center", gap: 14 },
  switchRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  switchHint: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted },
  switchAction: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});
