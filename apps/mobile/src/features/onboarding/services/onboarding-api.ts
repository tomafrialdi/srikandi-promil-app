import { supabase } from "@/lib/supabase";
import localConfig from "../data/onboarding-steps.json";
import type { OnboardingConfig } from "../types";
import type { OnboardingPayload } from "../utils/payload";

/**
 * Loads the onboarding form definition.
 * TODO(backend): replace with a request, e.g. supabase / fetch("/onboarding-config").
 * The response only needs to match `OnboardingConfig` (see ../types.ts).
 */
export async function fetchOnboardingConfig(): Promise<OnboardingConfig> {
  return localConfig as OnboardingConfig;
}

/**
 * Saves the completed answers to the signed-in user's profile (RPC `app_complete_onboarding`).
 * Requires a session, so it runs after the email is verified, not when the questions end.
 */
export async function submitOnboarding(payload: OnboardingPayload): Promise<void> {
  const { error } = await supabase.rpc("app_complete_onboarding", { p_payload: payload });
  if (error) throw new Error(error.message);
}
