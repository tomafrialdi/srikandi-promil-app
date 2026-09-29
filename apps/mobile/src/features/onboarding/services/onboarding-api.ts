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
 * Sends the completed answers.
 * TODO(backend): replace with a real request.
 */
export async function submitOnboarding(payload: OnboardingPayload): Promise<void> {
  console.log("[onboarding] submit", JSON.stringify(payload, null, 2));
}
