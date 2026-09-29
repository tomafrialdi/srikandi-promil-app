import { Stack } from "expo-router";

import { LogSheetHost } from "@/features/logging/components/log-sheet-host";
import { LoggingProvider } from "@/features/logging/context/logging-context";

/** Signed-in app: tabs, plus screens that share the logging data (e.g. "New note"). */
export default function AppLayout() {
  return (
    <LoggingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="new-note" options={{ presentation: "modal" }} />
      </Stack>
      <LogSheetHost />
    </LoggingProvider>
  );
}
