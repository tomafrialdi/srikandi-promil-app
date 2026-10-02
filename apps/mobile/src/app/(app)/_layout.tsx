import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";

import { useSession } from "@/features/auth/hooks/use-session";

import { reportDevice } from "@/lib/report-device";
import { LogSheetHost } from "@/features/logging/components/log-sheet-host";
import { LoggingProvider } from "@/features/logging/context/logging-context";

/** Signed-in app: tabs, plus screens that share the logging data (e.g. "New note"). */
export default function AppLayout() {
  const { session, loading } = useSession();
  const userId = session?.user.id;

  // Once per sign-in: keep the platform / app version / phone model on the profile up to date.
  useEffect(() => {
    if (userId) reportDevice().catch(() => undefined);
  }, [userId]);

  if (loading) return null;
  if (!session) return <Redirect href="/" />;

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
