import { useFocusEffect } from "expo-router";
import { Bell } from "phosphor-react-native";
import { useCallback, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { getPushStatus, syncPush, type PushStatus } from "../push/push-token";
import { syncReminders } from "../push/reminders";

/**
 * Shown while notifications are off on this phone. Asking happens here, on a tap, rather than when the app
 * opens. After a refusal the system won't ask again, so the button leads to the phone's Settings instead.
 */
export function EnablePushBanner() {
  const [status, setStatus] = useState<PushStatus | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getPushStatus()
        .then((s) => {
          if (!cancelled) setStatus(s);
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (!status || status.permission === "granted") return null;
  const blocked = status.permission === "denied";

  const onPress = async () => {
    if (blocked) {
      Linking.openSettings();
      return;
    }
    setStatus(await syncPush({ ask: true }));
    await syncReminders();
  };

  return (
    <View style={styles.banner}>
      <View style={styles.icon}>
        <Bell size={16} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Turn on notifications</Text>
        <Text style={styles.body}>
          {blocked
            ? "They're off in your phone's settings. Turn them on to get reminders and updates."
            : "Get reminders for your fertile window and period, plus updates from Srikandi Promil."}
        </Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
        <Text style={styles.buttonText}>{blocked ? "Settings" : "Turn on"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 15, color: colors.inkMuted },
  button: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.primary },
  buttonText: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
});
