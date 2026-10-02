import type { Icon } from "phosphor-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "@/constants/theme";

export interface TabBarItem {
  key: string;
  label: string;
  icon: Icon;
  active: boolean;
  /** Rendered as the separate round button instead of a pill tab. */
  action?: boolean;
  onPress: () => void;
}

/** Height of the floating bar itself (screens add insets + margin on top: see `useTabBarClearance`). */
export const TAB_BAR_HEIGHT = 56;
const BOTTOM_MARGIN = 8;
const SIDE_MARGIN = 16;
const TRANSITION = LinearTransition.duration(260);

/** Extra bottom padding a screen needs so its content isn't hidden behind the bar. */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + BOTTOM_MARGIN + 16;
}

/** The round "+" button: its icon spins a quarter turn each press. */
function ActionButton({ label, icon: ItemIcon, onPress }: Pick<TabBarItem, "label" | "icon" | "onPress">) {
  const turns = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turns.value * 90}deg` }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        turns.value = withTiming(turns.value + 1, { duration: 300 });
        onPress();
      }}
      style={styles.action}
    >
      <Animated.View style={iconStyle}>
        <ItemIcon size={20} color="#FAF9F5" />
      </Animated.View>
    </Pressable>
  );
}

/** Floating tab bar: a white pill of tabs (the active one expands to icon + label) and a separate round action button. */
export function TabBar({ items }: { items: TabBarItem[] }) {
  const insets = useSafeAreaInsets();
  const tabs = items.filter((item) => !item.action);
  const actions = items.filter((item) => item.action);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: insets.bottom + BOTTOM_MARGIN }]}
    >
      <View style={styles.pill}>
        {tabs.map(({ key, label, icon: ItemIcon, active, onPress }) => (
          <Animated.View key={key} layout={TRANSITION} style={[styles.item, active && styles.itemActive]}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              onPress={onPress}
              style={styles.itemPress}
            >
              <ItemIcon size={20} weight={active ? "fill" : "regular"} color={active ? colors.primary : colors.inkFaint} />
              {active && (
                <Animated.Text
                  entering={FadeIn.duration(200).delay(60)}
                  exiting={FadeOut.duration(100)}
                  numberOfLines={1}
                  style={styles.label}
                >
                  {label}
                </Animated.Text>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>
      {actions.map(({ key, label, icon, onPress }) => (
        <ActionButton key={key} label={label} icon={icon} onPress={onPress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pill: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    padding: 6,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: { minWidth: 44, borderRadius: 22, overflow: "hidden" },
  itemActive: { backgroundColor: colors.primarySoft },
  itemPress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  action: {
    width: TAB_BAR_HEIGHT,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
});
