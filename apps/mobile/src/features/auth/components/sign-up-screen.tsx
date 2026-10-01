import { router } from "expo-router";
import { Envelope, Lock, Sparkle } from "phosphor-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { DividerLabel } from "@/components/divider-label";
import { Checkbox } from "@/components/form/checkbox";
import { TextField } from "@/components/form/text-field";
import { SocialButtons } from "@/components/social-buttons";
import { colors, fonts, radius } from "@/constants/theme";
import { AUTH_COPY } from "../content";
import { AuthError, signInWithProvider, signUp } from "../services/auth-api";
import { isValidEmail } from "../utils/validation";
import { AuthScreen, SwitchLink } from "./auth-screen";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { ScreenTitle } from "./screen-title";

const copy = AUTH_COPY.signUp;
const errorCopy = AUTH_COPY.errors;

interface Errors {
  email?: string;
  password?: string;
  consent?: string;
}

/** `planBanner` is the onboarding summary ("Your plan is ready — …"); omit to hide it. */
export function SignUpScreen({ planBanner }: { planBanner?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const next: Errors = {};
    if (!email.trim()) next.email = errorCopy.emailRequired;
    else if (!isValidEmail(email)) next.email = errorCopy.emailInvalid;
    if (!password) next.password = errorCopy.passwordRequired;
    else if (password.length < 8) next.password = errorCopy.passwordShort;
    if (!agreeTerms || !consentData) next.consent = copy.consentError;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await signUp({ email: email.trim(), password });
      router.push({ pathname: "/onboarding/verify-email", params: { email: email.trim() } });
    } catch (e) {
      if (e instanceof AuthError) setErrors({ email: e.message });
      else throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
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
            onPress={() => router.push("/login")}
          />
        </>
      }
    >
      {planBanner ? (
        <View style={styles.banner}>
          <Sparkle size={16} color={colors.primary} />
          <Text style={styles.bannerText}>{planBanner}</Text>
        </View>
      ) : null}

      <ScreenTitle title={copy.title} subtitle={copy.subtitle} />

      <SocialButtons onPress={signInWithProvider} />
      <DividerLabel label={copy.divider} />

      <View style={styles.form}>
        <TextField
          label={copy.emailLabel}
          placeholder={copy.emailPlaceholder}
          icon={Envelope}
          value={email}
          onChange={(v) => {
            setEmail(v);
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
            setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={errors.password}
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <PasswordStrengthMeter password={password} />
      </View>

      <View style={styles.consents}>
        <Checkbox checked={agreeTerms} onChange={setAgreeTerms}>
          <Text style={styles.consentText}>{copy.terms}</Text>
        </Checkbox>
        <Checkbox checked={consentData} onChange={setConsentData}>
          <Text style={styles.consentText}>{copy.dataConsent}</Text>
        </Checkbox>
        {errors.consent ? <Text style={styles.error}>{errors.consent}</Text> : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  stretch: { alignSelf: "stretch" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  bannerText: { flex: 1, fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  form: { gap: 14 },
  consents: { gap: 10 },
  consentText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkMuted,
  },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error },
});
