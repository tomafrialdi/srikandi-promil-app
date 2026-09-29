import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { colors, radius } from "@/constants/theme";

interface ProgressDotsProps {
  total: number;
  /** Fractional step position (0 = first step), driven by the pager animation. */
  progress: SharedValue<number>;
}

export function ProgressDots({ total, progress }: ProgressDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} index={i} progress={progress} />
      ))}
    </View>
  );
}

function Dot({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const range = [index - 1, index, index + 1];
    return {
      width: interpolate(progress.get(), range, [8, 24, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(progress.get(), range, [
        colors.border,
        colors.primary,
        colors.border,
      ]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: radius.pill },
});
