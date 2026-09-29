import { Stack } from "expo-router";
import { useEffect, useState } from "react";

import { OnboardingProvider } from "@/features/onboarding/context/onboarding-context";
import { fetchOnboardingConfig } from "@/features/onboarding/services/onboarding-api";
import type { OnboardingConfig } from "@/features/onboarding/types";

export default function OnboardingLayout() {
  const [config, setConfig] = useState<OnboardingConfig | null>(null);

  useEffect(() => {
    fetchOnboardingConfig().then(setConfig);
  }, []);

  if (!config) return null;

  return (
    <OnboardingProvider config={config}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="loading" options={{ gestureEnabled: false }} />
        <Stack.Screen name="result" options={{ gestureEnabled: false }} />
      </Stack>
    </OnboardingProvider>
  );
}
