import { Tabs, router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

import { AppTabBar } from "@/components/tab-bar/app-tab-bar";

export default function TabsLayout() {
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
      tabBar={(props) => <AppTabBar {...props} onAddPress={() => router.push("/new-note")} />}
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
