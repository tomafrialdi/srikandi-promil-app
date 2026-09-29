import { MaskHappy } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

/** Reminds the user they post under an alias, never their real name. */
export function AnonymousBanner({ alias }: { alias: string }) {
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <MaskHappy size={17} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>You post as “{alias}”</Text>
        <Text style={styles.description}>Always anonymous. Your name & data are never shown.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  description: { fontFamily: fonts.medium, fontSize: 11, color: colors.primary },
});
