import { router, useFocusEffect } from "expo-router";
import { Flower } from "phosphor-react-native";
import { useCallback, useEffect } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts } from "@/constants/theme";
import { useOnboarding } from "../context/onboarding-context";
import { useAnalysisProgress } from "../hooks/use-analysis-progress";
import { AnalysisTaskItem, type TaskStatus } from "./loading/analysis-task-item";
import { ProgressRing } from "@/components/progress-ring";

export function OnboardingLoadingScreen() {
  const { config } = useOnboarding();
  const { title, subtitle, footnote, ctaLabel, tasks } = config.loading;
  const { activeIndex, done } = useAnalysisProgress(tasks);
  const progress = useSharedValue(0);

  // Ring fills smoothly over the duration of the task that is currently running.
  useEffect(() => {
    const duration = done ? 300 : tasks[activeIndex].durationMs;
    const target = Math.min(activeIndex + 1, tasks.length) / tasks.length;
    progress.set(withTiming(target, { duration, easing: Easing.linear }));
  }, [activeIndex, done, tasks, progress]);

  // Analysis can't be interrupted from here.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  const statusOf = (index: number): TaskStatus =>
    index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrapper}>
        <View />

        <View style={styles.center}>
          <ProgressRing progress={progress}>
            <Flower size={44} color={colors.primary} />
          </ProgressRing>

          <View style={styles.textCol}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.checklist}>
            {tasks.map((task, i) => (
              <AnalysisTaskItem key={task.id} label={task.label} status={statusOf(i)} />
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <ButtonPrimary
            label={ctaLabel}
            disabled={!done}
            onPress={() => router.replace("/onboarding/result")}
            style={styles.cta}
          />
          <Text style={styles.footnote}>{footnote}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  center: { alignSelf: "stretch", alignItems: "center", gap: 28 },
  textCol: { alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink, textAlign: "center" },
  subtitle: {
    width: 260,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: "center",
  },
  checklist: { width: "100%", maxWidth: 300, gap: 12 },
  bottom: { alignSelf: "stretch", alignItems: "center", gap: 14 },
  cta: { alignSelf: "stretch" },
  footnote: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkFaint },
});
