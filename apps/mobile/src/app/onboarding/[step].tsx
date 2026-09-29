import { Redirect, useLocalSearchParams } from "expo-router";

import { OnboardingStepScreen } from "@/features/onboarding/components/onboarding-step-screen";
import { useOnboarding } from "@/features/onboarding/context/onboarding-context";

export default function OnboardingStepRoute() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const { config } = useOnboarding();

  const stepIndex = Number(step) - 1;
  if (!Number.isInteger(stepIndex) || !config.steps[stepIndex]) {
    return <Redirect href={{ pathname: "/onboarding/[step]", params: { step: "1" } }} />;
  }

  return <OnboardingStepScreen stepIndex={stepIndex} />;
}
