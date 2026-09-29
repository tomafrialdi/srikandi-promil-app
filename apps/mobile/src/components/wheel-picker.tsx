import { useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { colors, fonts, radius } from "@/constants/theme";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5; // odd, so one item sits in the middle
const PADDING = ITEM_HEIGHT * ((VISIBLE_ITEMS - 1) / 2);

interface WheelPickerProps {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  /** Shown next to the selected number, e.g. "cm". */
  unit?: string;
}

/** Vertical roulette-style number picker: snaps to each item, tilts and fades the ones away from the center. */
export function WheelPicker({ values, value, onChange, unit }: WheelPickerProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const startIndex = Math.max(0, values.indexOf(value));
  // Start where the list is placed, so the initial item is drawn as centered
  // (setting contentOffset does not fire an onScroll event).
  const scrollY = useSharedValue(startIndex * ITEM_HEIGHT);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const next = values[Math.min(Math.max(index, 0), values.length - 1)];
    if (next !== undefined && next !== value) onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.band} />
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingVertical: PADDING }}
        contentOffset={{ x: 0, y: startIndex * ITEM_HEIGHT }}
        onLayout={() => scrollRef.current?.scrollTo({ y: startIndex * ITEM_HEIGHT, animated: false })}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
      >
        {values.map((v, i) => (
          <WheelItem key={v} index={i} label={String(v)} scrollY={scrollY} />
        ))}
      </Animated.ScrollView>
      {unit ? (
        <View pointerEvents="none" style={styles.unitWrap}>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      ) : null}
    </View>
  );
}

function WheelItem({
  index,
  label,
  scrollY,
}: {
  index: number;
  label: string;
  scrollY: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    // Item `index` is centered when scrollY === index * ITEM_HEIGHT.
    const at = index * ITEM_HEIGHT;
    const input = [at - 2 * ITEM_HEIGHT, at - ITEM_HEIGHT, at, at + ITEM_HEIGHT, at + 2 * ITEM_HEIGHT];
    const y = scrollY.get();
    return {
      opacity: interpolate(y, input, [0.25, 0.6, 1, 0.6, 0.25], Extrapolation.CLAMP),
      transform: [
        { perspective: 300 },
        { rotateX: `${interpolate(y, input, [-65, -32, 0, 32, 65], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(y, input, [0.8, 0.9, 1, 0.9, 0.8], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.item, style]}>
      <Text style={styles.itemText}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch", height: ITEM_HEIGHT * VISIBLE_ITEMS, justifyContent: "center" },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  scroll: { flex: 1 },
  item: { height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" },
  itemText: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  unitWrap: {
    position: "absolute",
    right: 0,
    left: 0,
    height: ITEM_HEIGHT,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 24,
  },
  unit: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
});
