import { router, useLocalSearchParams } from "expo-router";
import { EnvelopeSimple, Info, Timer } from "phosphor-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts, radius } from "@/constants/theme";
import { AUTH_COPY } from "../content";
import { useCountdown } from "../hooks/use-countdown";
import { AuthError, resendVerificationCode, verifyEmailCode } from "../services/auth-api";
import { goToHome } from "@/utils/navigation";
import { formatCountdown } from "../utils/validation";
import { AuthScreen, SwitchLink } from "./auth-screen";
import { OtpInput } from "./otp-input";
import { ScreenTitle } from "./screen-title";

const copy = AUTH_COPY.verifyEmail;
const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export function VerifyEmailScreen() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { remaining, restart } = useCountdown(RESEND_SECONDS);

  const handleVerify = async () => {
    setSubmitting(true);
    setCodeError(undefined);
    try {
      await verifyEmailCode({ email, code });
      goToHome();
    } catch (e) {
      if (e instanceof AuthError) setCodeError(e.message);
      else throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerificationCode(email);
      setCode("");
      setCodeError(undefined);
      restart();
    } catch (e) {
      if (e instanceof AuthError) setCodeError(e.message);
      else throw e;
    }
  };

  return (
    <AuthScreen
      footer={
        <>
          <ButtonPrimary
            label={copy.cta}
            onPress={handleVerify}
            disabled={code.length < CODE_LENGTH || submitting}
            style={styles.stretch}
          />
          <SwitchLink
            hint={copy.switchHint}
            action={copy.switchAction}
            onPress={() => router.back()}
          />
        </>
      }
    >
      <View style={styles.iconWrap}>
        <EnvelopeSimple size={28} color={colors.primary} />
      </View>

      <ScreenTitle title={copy.title} subtitle={copy.subtitle.replace("{email}", email)} />

      <View style={styles.otp}>
        <OtpInput
          length={CODE_LENGTH}
          value={code}
          hasError={!!codeError}
          onChange={(v) => {
            setCode(v);
            setCodeError(undefined);
          }}
        />
        {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}
      </View>

      {remaining > 0 ? (
        <View style={styles.resend}>
          <Timer size={14} color={colors.inkFaint} />
          <Text style={styles.resendWait}>
            {copy.resendIn.replace("{time}", formatCountdown(remaining))}
          </Text>
        </View>
      ) : (
        <Text accessibilityRole="link" onPress={handleResend} style={styles.resendAction}>
          {copy.resend}
        </Text>
      )}

      <View style={styles.tip}>
        <Info size={16} color={colors.info} />
        <Text style={styles.tipText}>{copy.tip}</Text>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  stretch: { alignSelf: "stretch" },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  otp: { gap: 8 },
  codeError: { fontFamily: fonts.medium, fontSize: 12, color: colors.error },
  resend: { flexDirection: "row", alignItems: "center", gap: 6 },
  resendWait: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkFaint },
  resendAction: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.info,
  },
});
