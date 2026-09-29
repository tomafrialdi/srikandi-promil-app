import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts } from "@/constants/theme";
import { useOnboarding } from "../context/onboarding-context";
import { ICONS } from "../icons";
import { FieldRenderer } from "./field-renderer";
import { ProgressDots } from "./progress-dots";

export function OnboardingStepScreen({ stepIndex }: { stepIndex: number }) {
  const { config, validate, submit } = useOnboarding();
  const [submitting, setSubmitting] = useState(false);

  const step = config.steps[stepIndex];
  const total = config.steps.length;
  const isLast = stepIndex === total - 1;
  const BackIcon = ICONS["arrow-left"];

  const handleContinue = async () => {
    if (!validate(stepIndex)) return;

    if (!isLast) {
      router.push({
        pathname: "/onboarding/[step]",
        params: { step: String(stepIndex + 2) },
      });
      return;
    }

    setSubmitting(true);
    try {
      await submit();
      // TODO: navigate to the loading / analysis screen once it is built.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => router.back()}
                style={styles.back}
              >
                <BackIcon size={18} color={colors.ink} />
              </Pressable>
              <ProgressDots total={total} current={stepIndex} />
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.subtitle}>{step.subtitle}</Text>
            </View>

            <View style={styles.form}>
              {step.fields.map((field, i) => (
                <FieldRenderer
                  key={field.type === "row" ? `row-${i}` : field.key}
                  field={field}
                />
              ))}
            </View>
          </View>

          <View style={styles.bottom}>
            <ButtonPrimary
              label={step.ctaLabel}
              onPress={handleContinue}
              disabled={submitting}
            />
            <Text style={styles.stepLabel}>
              Step {stepIndex + 1} of {total}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: 24,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  top: { gap: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: 40, height: 40 },
  titleBlock: { gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkMuted },
  form: { gap: 18 },
  bottom: { gap: 14 },
  stepLabel: {
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkFaint,
  },
});
