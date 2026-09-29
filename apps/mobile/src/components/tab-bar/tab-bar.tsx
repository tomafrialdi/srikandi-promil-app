import type { Icon } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "@/constants/theme";

export interface TabBarItem {
  key: string;
  label: string;
  icon: Icon;
  active: boolean;
  onPress: () => void;
}

/** Height of the floating bar itself (screens add insets + margin on top: see `useTabBarClearance`). */
export const TAB_BAR_HEIGHT = 56;
const BOTTOM_MARGIN = 8;
const SIDE_MARGIN = 16;

/** Extra bottom padding a screen needs so its content isn't hidden behind the bar. */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + BOTTOM_MARGIN + 16;
}

/** Floating, translucent tab bar. Purely presentational: feed it items. */
export function TabBar({ items }: { items: TabBarItem[] }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: insets.bottom + BOTTOM_MARGIN }]}
    >
      <View style={styles.bar}>
        {items.map(({ key, label, icon: ItemIcon, active, onPress }) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            onPress={onPress}
            style={[styles.item, active && styles.itemActive]}
          >
            <ItemIcon size={20} color={active ? colors.primary : colors.inkFaint} />
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", left: SIDE_MARGIN, right: SIDE_MARGIN },
  bar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 4,
    padding: 6,
    borderRadius: 28,
    backgroundColor: "#FFFFFFB3",
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 22,
  },
  itemActive: { backgroundColor: colors.primarySoft },
  label: { fontFamily: fonts.medium, fontSize: 10, color: colors.inkFaint },
  labelActive: { fontFamily: fonts.semibold, color: colors.primary },
});
