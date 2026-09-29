import { CheckCircle, SpinnerGap } from "phosphor-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, fonts, radius } from "@/constants/theme";

export type TaskStatus = "done" | "active" | "pending";

function Spinner() {
  const turn = useSharedValue(0);

  useEffect(() => {
    turn.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1));
    return () => cancelAnimation(turn);
  }, [turn]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 360}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <SpinnerGap size={18} color={colors.primary} />
    </Animated.View>
  );
}

export function AnalysisTaskItem({ label, status }: { label: string; status: TaskStatus }) {
  return (
    <View style={[styles.row, status === "active" && styles.rowActive]}>
      <View style={styles.icon}>
        {status === "done" ? <CheckCircle size={18} color={colors.success} /> : null}
        {status === "active" ? <Spinner /> : null}
        {status === "pending" ? <View style={styles.pendingDot} /> : null}
      </View>
      <Text style={[styles.label, status === "pending" && styles.labelPending]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  icon: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  pendingDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
  },
  label: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  labelPending: { color: colors.inkFaint },
});
