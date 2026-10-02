import { Tabs, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

import { AppTabBar } from "@/components/tab-bar/app-tab-bar";
import { useLogging } from "@/features/logging/context/logging-context";

export default function TabsLayout() {
  const { openLog } = useLogging();
  // Home is the root of the signed-in app: Android back exits instead of returning to the splash.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        BackHandler.exitApp();
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} onAddPress={() => openLog("new-note")} />}
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
