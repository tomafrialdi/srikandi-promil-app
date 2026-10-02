import type { Tabs } from "expo-router";
import { CalendarDots, ChartBar, House, Plus, User, type Icon } from "phosphor-react-native";
import type { ComponentProps } from "react";

import { TabBar, type TabBarItem } from "./tab-bar";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

interface TabConfig {
  label: string;
  icon: Icon;
  /** Action tabs run `onActionPress` instead of switching screens. */
  action?: boolean;
}

/** The app's tabs, keyed by route name, in display order. Add or reorder tabs here. */
export const TAB_CONFIG: Record<string, TabConfig> = {
  home: { label: "Home", icon: House },
  calendar: { label: "Calendar", icon: CalendarDots },
  add: { label: "Add", icon: Plus, action: true },
  insights: { label: "Insights", icon: ChartBar },
  account: { label: "Account", icon: User },
};

/** Connects the presentational `TabBar` to expo-router's tab navigation state. */
export function AppTabBar({
  state,
  navigation,
  onAddPress,
}: TabBarProps & { /** Runs when an action tab (the "+" button) is pressed. */ onAddPress?: () => void }) {
  const items: TabBarItem[] = state.routes.flatMap((route, index) => {
    const config = TAB_CONFIG[route.name];
    if (!config) return [];

    const active = state.index === index;
    const onPress = () => {
      if (config.action) {
        onAddPress?.();
        return;
      }
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!active && !event.defaultPrevented) navigation.navigate(route.name);
    };

    return [{ key: route.key, label: config.label, icon: config.icon, active, action: config.action, onPress }];
  });

  return <TabBar items={items} />;
}
