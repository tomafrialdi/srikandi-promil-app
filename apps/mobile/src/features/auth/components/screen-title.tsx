import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

export function ScreenTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.inkMuted },
});
