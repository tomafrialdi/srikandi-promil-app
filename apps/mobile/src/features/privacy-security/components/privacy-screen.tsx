import { router } from "expo-router";
import {
  BellSlash,
  CalendarBlank,
  CaretRight,
  Download,
  Key,
  ScanSmiley,
  Timer,
  Trash,
  type Icon,
} from "phosphor-react-native";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InsetList } from "@/components/list/inset-list";
import { InsetToggleItem } from "@/components/list/inset-toggle-item";
import { ScreenHeader } from "@/components/screen-header";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts } from "@/constants/theme";
import { signOut } from "@/features/auth/services/auth-api";
import { privacyApi } from "../api/privacy-api";
import { usePrivacy } from "../hooks/use-privacy";
import type { PrivacyToggleKey } from "../types";
import { LockScreenPreview } from "./lock-screen-preview";
import { TrustCard } from "./trust-card";

const APP_LOCK: { key: PrivacyToggleKey; label: string; icon: Icon }[] = [
  { key: "biometric", label: "Face ID / fingerprint", icon: ScanSmiley },
  { key: "pinBackup", label: "6-digit PIN backup", icon: Key },
  { key: "lockAfterOneMinute", label: "Lock after 1 minute in background", icon: Timer },
];

const DISCREET: { key: PrivacyToggleKey; label: string; icon: Icon }[] = [
  { key: "disguiseIcon", label: "Disguise app icon as “Kalender”", icon: CalendarBlank },
  { key: "hideSensitiveWords", label: "Hide sensitive words in notifications", icon: BellSlash },
];

export function PrivacyScreen() {
  const { data, setToggle } = usePrivacy();

  const handleDownload = async () => {
    await privacyApi.requestDataExport();
    Alert.alert("Request received", "We'll email you a link to download your data.");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete all data?",
      "This permanently erases your cycles, logs and profile. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            await privacyApi.deleteAllData();
            await signOut();
            router.dismissTo("/");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Privacy & security" />

        {data ? (
          <>
            <TrustCard points={data.trustPoints} />

            {/* TODO: biometrics need expo-local-authentication; the PIN needs a create-PIN screen. */}
            <SectionHeader title="App lock" />
            <InsetList>
              {APP_LOCK.map((item) => (
                <InsetToggleItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={data.toggles[item.key]}
                  onValueChange={(v) => setToggle(item.key, v)}
                />
              ))}
            </InsetList>

            {/* TODO: switching the app icon needs an alternate-icon module (native build). */}
            <SectionHeader title="Discreet mode" />
            <InsetList>
              {DISCREET.map((item) => (
                <InsetToggleItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={data.toggles[item.key]}
                  onValueChange={(v) => setToggle(item.key, v)}
                />
              ))}
            </InsetList>

            <LockScreenPreview
              before={data.preview.before}
              after={data.preview.after}
              active={data.toggles.hideSensitiveWords ? "after" : "before"}
            />

            <InsetList>
              <Pressable accessibilityRole="button" onPress={handleDownload} style={styles.action}>
                <Download size={17} color={colors.ink} />
                <Text style={styles.actionLabel}>Download my data</Text>
                <CaretRight size={16} color={colors.inkFaint} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={handleDelete} style={styles.action}>
                <Trash size={17} color={colors.error} />
                <Text style={[styles.actionLabel, styles.danger]}>Delete all data permanently</Text>
                <CaretRight size={16} color={colors.inkFaint} />
              </Pressable>
            </InsetList>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 20, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 32 },
  action: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  actionLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  danger: { color: colors.error },
});

