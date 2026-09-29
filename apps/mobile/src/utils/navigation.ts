import { router } from "expo-router";

/** Enters the signed-in app: replaces the current auth/onboarding screen with Home. */
export function goToHome() {
  router.replace("/home");
}
