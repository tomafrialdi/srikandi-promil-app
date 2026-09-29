import { ArrowRight, Sparkle } from "phosphor-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";

import { ProgressRing } from "@/components/progress-ring";
import { colors, fonts, radius } from "@/constants/theme";
import type { HomeDashboard } from "../types";

interface CycleHeroCardProps {
  cycle: HomeDashboard["cycle"];
  onLogPress?: () => void;
}

export function CycleHeroCard({ cycle, onLogPress }: CycleHeroCardProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withTiming(cycle.day / cycle.length, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [cycle.day, cycle.length, progress]);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.badge}>
          <Sparkle size={12} color={colors.white} />
          <Text style={styles.badgeText}>{cycle.phaseLabel}</Text>
        </View>

        <View>
          <Text style={styles.day}>Cycle Day {cycle.day}</Text>
          <Text style={styles.caption}>{cycle.caption}</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={onLogPress} style={styles.logButton}>
          <Text style={styles.logText}>{cycle.ctaLabel}</Text>
          <ArrowRight size={12} color={colors.primary} />
        </Pressable>
      </View>

      <ProgressRing
        progress={progress}
        size={76}
        strokeWidth={6}
        color={colors.white}
        trackColor="#FFFFFF33"
      >
        <Text style={styles.ringText}>
          {cycle.day}/{cycle.length}
        </Text>
      </ProgressRing>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 22,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  info: { gap: 10 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.whiteGlass,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  day: { fontFamily: fonts.bold, fontSize: 22, color: colors.white },
  caption: { fontFamily: fonts.medium, fontSize: 13, color: colors.whiteSoft },
  logButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  logText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  ringText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
});
