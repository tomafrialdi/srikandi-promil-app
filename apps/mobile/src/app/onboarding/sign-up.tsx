import { SignUpScreen } from "@/features/auth/components/sign-up-screen";
import { useOnboarding } from "@/features/onboarding/context/onboarding-context";

export default function SignUpRoute() {
  const { config, result } = useOnboarding();
  const planBanner = result
    ? config.result.signUpBanner.replace("{fertileWindowShort}", result.fertileWindowShort)
    : undefined;

  return <SignUpScreen planBanner={planBanner} />;
}
