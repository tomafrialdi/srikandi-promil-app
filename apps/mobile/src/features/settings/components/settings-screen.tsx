import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ButtonOutline } from "@/components/button-outline";
import { ListRow } from "@/components/list/list-row";
import { ListSection } from "@/components/list/list-section";
import { ToggleRow } from "@/components/list/toggle-row";
import { StickyScreen } from "@/components/sticky-screen";
import { useTabBarClearance } from "@/components/tab-bar/tab-bar";
import { colors, fonts } from "@/constants/theme";
import { signOut } from "@/features/auth/services/auth-api";
import { useSettings } from "../hooks/use-settings";
import {
  NOTIFICATION_TOGGLES,
  SETTINGS_SECTIONS,
  SETTINGS_SECTIONS_AFTER_NOTIFICATIONS,
  type SettingsMenuSection,
} from "../menu";
import type { SettingsSummary } from "../types";
import { ProfileCard } from "./profile-card";
import { ROW_TO_SHEET, SettingsSheets, type SettingsSheetId } from "./settings-sheets";

/** Account tab: profile, settings menus, notification toggles, and log out. */
export function SettingsScreen() {
  const { summary, setNotification, updateProfile, updateCycle, updateUnits } = useSettings();
  const [sheet, setSheet] = useState<SettingsSheetId | null>(null);
  const bottomClearance = useTabBarClearance();

  const handleLogOut = async () => {
    await signOut();
    router.dismissTo("/");
  };

  /** Rows that open a sheet instead of a screen. */
  const handleRowPress = (rowId: string) => {
    const target = ROW_TO_SHEET[rowId];
    if (target) setSheet(target);
  };

  return (
    <>
      <StickyScreen
        edges={["top"]}
        bottomPadding={bottomClearance}
        contentStyle={styles.content}
        header={<Text style={styles.title}>Settings</Text>}
      >

        {summary ? (
          <>
            <ProfileCard
              name={summary.profile.name}
              email={summary.profile.email}
              onPress={() => setSheet("personal")}
            />

            {SETTINGS_SECTIONS.map((section) => (
              <MenuSection key={section.title} section={section} summary={summary} onRowPress={handleRowPress} />
            ))}

            <ListSection title="Notifications">
              {NOTIFICATION_TOGGLES.map((toggle) => (
                <ToggleRow
                  key={toggle.key}
                  label={toggle.label}
                  description={toggle.description}
                  value={summary.notifications[toggle.key]}
                  onValueChange={(enabled) => setNotification(toggle.key, enabled)}
                />
              ))}
            </ListSection>

            {SETTINGS_SECTIONS_AFTER_NOTIFICATIONS.map((section) => (
              <MenuSection key={section.title} section={section} summary={summary} onRowPress={handleRowPress} />
            ))}

            <ButtonOutline label="Log out" tone="danger" onPress={handleLogOut} />
            <Text style={styles.version}>Srikandi Promil v{Constants.expoConfig?.version ?? "1.0.0"}</Text>
          </>
        ) : (
          <View />
        )}
      </StickyScreen>

      {summary ? (
        <SettingsSheets
          active={sheet}
          onClose={() => setSheet(null)}
          summary={summary}
          onSaveProfile={updateProfile}
          onSaveCycle={updateCycle}
          onSaveUnits={updateUnits}
        />
      ) : null}
    </>
  );
}

function MenuSection({
  section,
  summary,
  onRowPress,
}: {
  section: SettingsMenuSection;
  summary: SettingsSummary;
  onRowPress: (rowId: string) => void;
}) {
  return (
    <ListSection title={section.title}>
      {section.rows.map((row) => {
        const value = row.valueKey ? summary.values[row.valueKey] : undefined;
        return (
          <ListRow
            key={row.id}
            label={row.label}
            icon={row.icon}
            iconTone={row.iconTone}
            value={value?.text}
            valueHighlighted={value?.highlighted}
            // Rows open a sheet (ROW_TO_SHEET) or a screen (`href`); others do nothing yet.
            onPress={() => (row.href ? router.push(row.href) : onRowPress(row.id))}
          />
        );
      })}
    </ListSection>
  );
}

const styles = StyleSheet.create({
  content: { gap: 26 },
  title: { textAlign: "center", fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  version: { textAlign: "center", fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
});
