import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ButtonPrimary } from "@/components/button-primary";
import { IconCircle } from "@/components/icon-circle";
import { InsetList } from "@/components/list/inset-list";
import { ScreenHeader } from "@/components/screen-header";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius } from "@/constants/theme";
import { trackingModeApi } from "../api/tracking-mode-api";
import { useTrackingMode } from "../hooks/use-tracking-mode";
import { CHANGE_ICONS, MODE_ICONS } from "../icons";
import type { TrackingModeData } from "../types";

export function TrackingModeScreen() {
  const { data } = useTrackingMode();

  return (
    <SafeAreaView style={styles.safe}>
      {data ? <TrackingModeForm data={data} /> : <ScreenHeader title="Tracking mode" />}
    </SafeAreaView>
  );
}

/** Mounted once the data is loaded, so the draft starts from the saved mode. */
function TrackingModeForm({ data }: { data: TrackingModeData }) {
  const [selectedId, setSelectedId] = useState(data.selectedId);
  const [saving, setSaving] = useState(false);

  const selected = data.modes.find((m) => m.id === selectedId) ?? data.modes[0];

  const handleSave = async () => {
    setSaving(true);
    try {
      await trackingModeApi.select(selectedId);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Tracking mode" />

      <Text style={styles.intro}>
        Choose what fits your body. We&apos;ll adapt predictions, reminders and content.
      </Text>

      <View style={styles.modes}>
        {data.modes.map((mode) => {
          const active = mode.id === selectedId;
          return (
            <Pressable
              key={mode.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedId(mode.id)}
              style={[styles.mode, active && styles.modeActive]}
            >
              <IconCircle icon={MODE_ICONS[mode.icon]} tone={active ? "primary" : "neutral"} size={38} solid={active} />
              <View style={styles.modeText}>
                <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>{mode.title}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]} />
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title={`What changes in ${selected.changesTitle}`} />
      <InsetList>
        {selected.changes.map((change) => {
          const ChangeIcon = CHANGE_ICONS[change.icon];
          return (
            <View key={change.title} style={styles.change}>
              <ChangeIcon size={18} color={colors.primary} />
              <View style={styles.changeText}>
                <Text style={styles.changeTitle}>{change.title}</Text>
                <Text style={styles.modeDescription}>{change.description}</Text>
              </View>
            </View>
          );
        })}
      </InsetList>

      <ButtonPrimary label="Save tracking mode" onPress={handleSave} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 20, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 32 },
  intro: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
  modes: { gap: 10 },
  mode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  modeActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  modeText: { flex: 1, gap: 2 },
  modeTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  modeTitleActive: { color: colors.primary },
  modeDescription: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    backgroundColor: colors.card,
  },
  radioActive: { borderWidth: 5, borderColor: colors.primary },
  change: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  changeText: { flex: 1, gap: 2 },
  changeTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
});
