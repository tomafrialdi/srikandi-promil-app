import { Flower } from "phosphor-react-native";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts } from "@/constants/theme";

export default function Splash() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.mark}>
          <Flower size={44} color={colors.white} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.appName}>SRIKANDI PROMIL</Text>
          <Text style={styles.tagline}>
            Your gentle companion on the path to pregnancy
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 44) }]}>
        <ButtonPrimary
          label="Create account"
          backgroundColor={colors.white}
          labelColor={colors.primary}
          onPress={() =>
            router.push({ pathname: "/onboarding/[step]", params: { step: "1" } })
          }
          style={styles.cta}
        />
        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>Already have an account?</Text>
          <Text style={styles.loginLink}>Log in</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.whiteGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    alignItems: "center",
    gap: 6,
  },
  appName: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.white,
  },
  tagline: {
    width: 260,
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.whiteSoft,
  },
  footer: {
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 16,
  },
  cta: {
    alignSelf: "stretch",
  },
  loginRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  loginHint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.whiteSoft,
  },
  loginLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
});
