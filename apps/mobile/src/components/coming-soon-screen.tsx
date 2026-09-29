import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "@/constants/theme";

/** Temporary body for tabs that aren't built yet. */
export function ComingSoonScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkMuted },
});
