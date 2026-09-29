import { REQUIRED_MESSAGE } from "@/components/form/field-shell";

/** All user-facing copy for the auth screens, in one place. */
export const AUTH_COPY = {
  signUp: {
    title: "Create your account",
    subtitle: "Save your plan and sync it safely across devices.",
    divider: "or sign up with email",
    emailLabel: "Email",
    emailPlaceholder: "e.g. amara.putri@gmail.com",
    passwordLabel: "Password",
    terms: "I agree to the Terms of Use and Privacy Policy.",
    dataConsent:
      "I consent to Srikandi Promil processing my health data to give me fertility predictions (UU PDP). I can withdraw anytime.",
    consentError: "Please accept both to continue",
    cta: "Create account",
    switchHint: "Already have an account?",
    switchAction: "Log in",
  },
  verifyEmail: {
    title: "Check your email",
    subtitle: "We sent a 6-digit code to {email}",
    resendIn: "Resend code in {time}",
    resend: "Resend code",
    tip: "Can't find it? Check Promotions or Spam. The email comes from halo@srikandipromil.id",
    cta: "Verify & open my dashboard",
    switchHint: "Wrong email?",
    switchAction: "Change it",
  },
  login: {
    title: "Welcome back 🌸",
    subtitle: "Log in to continue tracking your cycle.",
    biometricTitle: "Continue as {name}",
    biometricSubtitle: "Use Face ID",
    dividerOr: "or",
    emailLabel: "Email",
    emailPlaceholder: "e.g. amara.putri@gmail.com",
    passwordLabel: "Password",
    remember: "Remember me",
    forgot: "Forgot password?",
    dividerSocial: "or continue with",
    cta: "Log in",
    switchHint: "New to Srikandi Promil?",
    switchAction: "Create account",
  },
  errors: {
    emailRequired: REQUIRED_MESSAGE,
    emailInvalid: "Enter a valid email",
    passwordRequired: REQUIRED_MESSAGE,
    passwordShort: "Use at least 8 characters",
    invalidCredentials: "Incorrect email or password",
    invalidCode: "That code isn't right. Please try again.",
  },
} as const;
