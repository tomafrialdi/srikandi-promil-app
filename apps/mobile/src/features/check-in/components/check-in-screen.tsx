import { router, useLocalSearchParams } from "expo-router";
import { CaretRight, ChatCircleDots, ClockCounterClockwise, Lock } from "phosphor-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ButtonPrimary } from "@/components/button-primary";
import { IconButton } from "@/components/icon-button";
import { IconCircle } from "@/components/icon-circle";
import { OptionPill } from "@/components/option-pill";
import { ScreenHeader } from "@/components/screen-header";
import { colors, fonts } from "@/constants/theme";
import { checkInApi } from "../api/check-in-api";
import { useCheckIn } from "../hooks/use-check-in";
import type { CheckInData } from "../types";
import { MoodScale } from "./mood-scale";
import { WeekMoodCard } from "./week-mood-card";

export function CheckInScreen() {
  const { data } = useCheckIn();
  // Set when opened from the Home card: that emoji starts selected.
  const { mood } = useLocalSearchParams<{ mood?: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      {data ? (
        <CheckInForm data={data} initialMoodId={mood ?? data.today.moodId} />
      ) : (
        <View style={styles.header}>
          <ScreenHeader title="Daily check-in" />
        </View>
      )}
    </SafeAreaView>
  );
}

/** Mounted once the data is loaded, so the draft starts from the saved values (or the tapped emoji). */
function CheckInForm({ data, initialMoodId }: { data: CheckInData; initialMoodId: string | null }) {
  const [moodId, setMoodId] = useState<string | null>(initialMoodId);
  const [stressorIds, setStressorIds] = useState<string[]>(data.today.stressorIds);
  const [journal, setJournal] = useState(data.today.journal);
  const [saving, setSaving] = useState(false);

  const toggleStressor = (id: string) =>
    setStressorIds((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));

  // Today's slot in "Your week" follows the emoji being picked.
  const week = data.week.map((day, i) => (i === data.week.length - 1 ? { ...day, moodId } : day));

  const handleSave = async () => {
    if (!moodId) return;
    setSaving(true);
    try {
      await checkInApi.save({ moodId, stressorIds, journal: journal.trim() });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* TODO: open past check-ins (no design yet). */}
        <ScreenHeader
          title="Daily check-in"
          right={<IconButton icon={ClockCounterClockwise} label="Check-in history" />}
        />

        <View style={styles.intro}>
          <Text style={styles.question}>How are you, really?</Text>
          <Text style={styles.sub}>Trying to conceive is emotional. There&apos;s no right answer here.</Text>
        </View>

        <MoodScale moods={data.moods} value={moodId} onChange={setMoodId} />

        <Text style={styles.blockTitle}>What&apos;s weighing on you?</Text>
        <View style={styles.chips}>
          {data.stressors.map((s) => (
            <OptionPill
              key={s.id}
              label={s.label}
              fill={false}
              selected={stressorIds.includes(s.id)}
              onPress={() => toggleStressor(s.id)}
            />
          ))}
        </View>

        <View style={styles.journal}>
          <View style={styles.journalHead}>
            <Lock size={12} color={colors.inkFaint} />
            <Text style={styles.journalLabel}>Private journal</Text>
          </View>
          <TextInput
            value={journal}
            onChangeText={setJournal}
            placeholder="Write what's on your mind…"
            placeholderTextColor={colors.inkFaint}
            multiline
            textAlignVertical="top"
            style={styles.journalInput}
          />
        </View>

        <WeekMoodCard week={week} moods={data.moods} streakDays={data.streakDays} />

        {/* TODO: open counsellor booking / chat (no design yet). */}
        <Pressable accessibilityRole="button" style={styles.support}>
          <IconCircle icon={ChatCircleDots} tone="info" size={44} />
          <View style={styles.supportText}>
            <Text style={styles.supportTitle}>{data.counsellor.title}</Text>
            <Text style={styles.supportDescription}>{data.counsellor.description}</Text>
          </View>
          <CaretRight size={18} color={colors.info} />
        </Pressable>

        <ButtonPrimary label="Save check-in" onPress={handleSave} disabled={!moodId || saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: { paddingTop: 8, paddingHorizontal: 20 },
  content: { gap: 20, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 32 },
  intro: { gap: 8 },
  question: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink },
  sub: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
  blockTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: -8 },
  journal: {
    minHeight: 120,
    gap: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  journalHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  journalLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.inkFaint },
  journalInput: { flex: 1, minHeight: 72, padding: 0, fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  support: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.infoSoft,
  },
  supportText: { flex: 1, gap: 2 },
  supportTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.info },
  supportDescription: { fontFamily: fonts.medium, fontSize: 11, color: colors.info },
});

