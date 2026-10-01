import type { AuthError as SupabaseAuthError } from "@supabase/supabase-js";

import type { SocialProvider } from "@/components/social-buttons";
import { supabase } from "@/lib/supabase";
import { AUTH_COPY } from "../content";

/** Auth backend calls (Supabase Auth). Errors are mapped to user-facing `AuthError`s. */

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function toAuthError(error: SupabaseAuthError): AuthError {
  const copy = AUTH_COPY.errors;
  if (__DEV__) console.warn("[auth]", error.status, error.code, error.message);
  switch (error.code) {
    case "invalid_credentials":
      return new AuthError(copy.invalidCredentials, error.code);
    case "email_not_confirmed":
      return new AuthError(copy.emailNotConfirmed, error.code);
    case "otp_expired":
    case "validation_failed":
      return new AuthError(copy.invalidCode, error.code);
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return new AuthError(copy.tooManyRequests, error.code);
    case "email_address_invalid":
      return new AuthError(AUTH_COPY.errors.emailInvalid, error.code);
    case "weak_password":
      return new AuthError(AUTH_COPY.errors.passwordShort, error.code);
    case "user_already_exists":
    case "email_exists":
      return new AuthError(copy.emailTaken, error.code);
    default:
      return new AuthError(copy.generic, error.code);
  }
}

/** Creates the account and emails a 6-digit code; the session starts after `verifyEmailCode`. */
export async function signUp(input: { email: string; password: string }): Promise<void> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { app: "mobile" } },
  });
  if (error) throw toAuthError(error);
  // With email confirmation on, an already-registered address returns no error and no identities.
  if (data.user && data.user.identities?.length === 0) {
    throw new AuthError(AUTH_COPY.errors.emailTaken, "email_exists");
  }
}

/** The session is always persisted; `remember` is kept for the "Remember me" UI. */
export async function signIn(input: {
  email: string;
  password: string;
  remember: boolean;
}): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw toAuthError(error);
}

/** TODO(backend): Google / Apple need their own credentials; not wired yet. */
export async function signInWithProvider(provider: SocialProvider): Promise<void> {
  console.log("[auth] signInWithProvider", provider);
}

export async function verifyEmailCode(input: { email: string; code: string }): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: input.email,
    token: input.code,
    type: "signup",
  });
  if (error) throw toAuthError(error);
}

export async function resendVerificationCode(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw toAuthError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toAuthError(error);
}
