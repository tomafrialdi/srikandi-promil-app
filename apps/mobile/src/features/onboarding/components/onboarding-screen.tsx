import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts } from "@/constants/theme";
import { useOnboarding } from "../context/onboarding-context";
import { OnboardingStepPage } from "./onboarding-step-page";
import { ProgressDots } from "./progress-dots";

const SLIDE_MS = 340;

/**
 * Wizard shell. Header (back + dots) and footer (CTA) stay put; only the
 * step content slides horizontally, and the dots animate with it.
 */
export function OnboardingScreen() {
  const { config, validate } = useOnboarding();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const progress = useSharedValue(0);

  const total = config.steps.length;
  const isLast = step === total - 1;

  const goTo = useCallback(
    (index: number) => {
      Keyboard.dismiss();
      setStep(index);
      progress.set(
        withTiming(index, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) }),
      );
    },
    [progress],
  );

  const goBack = useCallback(() => {
    if (step > 0) goTo(step - 1);
    else router.back();
  }, [step, goTo]);

  // Android hardware back steps through the wizard before leaving it.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (step === 0) return false;
        goTo(step - 1);
        return true;
      });
      return () => sub.remove();
    }, [step, goTo]),
  );

  // Answers are saved after sign-up (verify-email screen); there is no session yet here.
  const handleContinue = () => {
    if (!validate(step)) return;
    if (isLast) router.replace("/onboarding/loading");
    else goTo(step + 1);
  };

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -progress.get() * width }],
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <BackButton onPress={goBack} />
          <ProgressDots total={total} progress={progress} />
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.viewport}>
          <Animated.View style={[styles.track, { width: width * total }, trackStyle]}>
            {config.steps.map((s) => (
              <OnboardingStepPage key={s.id} step={s} width={width} />
            ))}
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <ButtonPrimary
            label={config.steps[step].ctaLabel}
            onPress={handleContinue}
          />
          <Text style={styles.stepLabel}>
            Step {step + 1} of {total}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  headerSpacer: { width: 40, height: 40 },
  viewport: { flex: 1, overflow: "hidden" },
  track: { flex: 1, flexDirection: "row" },
  footer: { gap: 14, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 28 },
  stepLabel: {
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkFaint,
  },
});
