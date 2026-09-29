import type { SocialProvider } from "@/components/social-buttons";
import { AUTH_COPY } from "../content";
import { DUMMY_AUTH } from "../dummy-credentials";

/**
 * Auth backend calls. Until the backend exists they only log, and validate
 * against `DUMMY_AUTH` (see ../dummy-credentials.ts).
 * TODO(backend): replace each with the real request (e.g. supabase.auth.*).
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export async function signUp(input: { email: string; password: string }): Promise<void> {
  console.log("[auth] signUp", input.email);
}

export async function signIn(input: {
  email: string;
  password: string;
  remember: boolean;
}): Promise<void> {
  console.log("[auth] signIn", input.email, { remember: input.remember });
  if (
    DUMMY_AUTH.enabled &&
    !(sameEmail(input.email, DUMMY_AUTH.email) && input.password === DUMMY_AUTH.password)
  ) {
    throw new AuthError(AUTH_COPY.errors.invalidCredentials);
  }
}

export async function signInWithProvider(provider: SocialProvider): Promise<void> {
  console.log("[auth] signInWithProvider", provider);
}

export async function verifyEmailCode(input: { email: string; code: string }): Promise<void> {
  console.log("[auth] verifyEmailCode", input.email, input.code);
  if (DUMMY_AUTH.enabled && input.code !== DUMMY_AUTH.otp) {
    throw new AuthError(AUTH_COPY.errors.invalidCode);
  }
}

export async function resendVerificationCode(email: string): Promise<void> {
  console.log("[auth] resendVerificationCode", email);
}

/** Ends the session. TODO(backend): revoke the token and clear stored credentials. */
export async function signOut(): Promise<void> {
  console.log("[auth] signOut");
}
