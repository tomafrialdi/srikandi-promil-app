import { router } from "expo-router";
import { CaretRight, Envelope, Flower, Lock, ScanSmiley } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { DividerLabel } from "@/components/divider-label";
import { Checkbox } from "@/components/form/checkbox";
import { TextField } from "@/components/form/text-field";
import { SocialButtons } from "@/components/social-buttons";
import { colors, fonts, radius } from "@/constants/theme";
import { AUTH_COPY } from "../content";
import { AuthError, resendVerificationCode, signIn, signInWithProvider } from "../services/auth-api";
import { goToHome } from "@/utils/navigation";
import { isValidEmail } from "../utils/validation";
import { AuthScreen, SwitchLink } from "./auth-screen";
import { ScreenTitle } from "./screen-title";

const copy = AUTH_COPY.login;
const errorCopy = AUTH_COPY.errors;

interface LoginScreenProps {
  /**
   * Name of a user with Face ID enabled on this device; shows the "Continue as …" card.
   * TODO: supply from secure storage + expo-local-authentication.
   */
  biometricUser?: string;
}

export function LoginScreen({ biometricUser }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = errorCopy.emailRequired;
    else if (!isValidEmail(email)) next.email = errorCopy.emailInvalid;
    if (!password) next.password = errorCopy.passwordRequired;
    setErrors(next);
    setFormError(undefined);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password, remember });
      goToHome();
    } catch (e) {
      if (e instanceof AuthError && e.code === "email_not_confirmed") {
        await resendVerificationCode(email.trim()).catch(() => undefined);
        router.push({ pathname: "/onboarding/verify-email", params: { email: email.trim() } });
      } else if (e instanceof AuthError) setFormError(e.message);
      else throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      gap={18}
      footer={
        <>
          <ButtonPrimary
            label={copy.cta}
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.stretch}
          />
          <SwitchLink
            hint={copy.switchHint}
            action={copy.switchAction}
            onPress={() => router.replace("/onboarding")}
          />
        </>
      }
    >
      <View style={styles.mark}>
        <Flower size={28} color={colors.white} />
      </View>

      <ScreenTitle title={copy.title} subtitle={copy.subtitle} />

      {biometricUser ? (
        <>
          <Pressable accessibilityRole="button" style={styles.biometric}>
            <View style={styles.biometricIcon}>
              <ScanSmiley size={20} color={colors.primary} />
            </View>
            <View style={styles.biometricText}>
              <Text style={styles.biometricTitle}>
                {copy.biometricTitle.replace("{name}", biometricUser)}
              </Text>
              <Text style={styles.biometricSubtitle}>{copy.biometricSubtitle}</Text>
            </View>
            <CaretRight size={17} color={colors.inkFaint} />
          </Pressable>
          <DividerLabel label={copy.dividerOr} />
        </>
      ) : null}

      <View style={styles.form}>
        <TextField
          label={copy.emailLabel}
          placeholder={copy.emailPlaceholder}
          icon={Envelope}
          value={email}
          onChange={(v) => {
            setEmail(v);
            setFormError(undefined);
            setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label={copy.passwordLabel}
          icon={Lock}
          value={password}
          onChange={(v) => {
            setPassword(v);
            setFormError(undefined);
            setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={errors.password}
          secure
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
        />
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <View style={styles.optionsRow}>
          <Checkbox checked={remember} onChange={setRemember} size={18}>
            <Text style={styles.rememberText}>{copy.remember}</Text>
          </Checkbox>
          {/* TODO: link to the forgot-password screen once it exists. */}
          <Text style={styles.forgot}>{copy.forgot}</Text>
        </View>
      </View>

      <DividerLabel label={copy.dividerSocial} />
      <SocialButtons onPress={signInWithProvider} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  stretch: { alignSelf: "stretch" },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  biometric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  biometricIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  biometricText: { flex: 1, gap: 1 },
  biometricTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  biometricSubtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  form: { gap: 14 },
  formError: { fontFamily: fonts.medium, fontSize: 12, color: colors.error },
  optionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rememberText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  forgot: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
});
