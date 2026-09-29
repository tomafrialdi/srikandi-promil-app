import { router } from "expo-router";
import { CalendarBlank, CaretDown, Drop, Thermometer, X } from "phosphor-react-native";
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
import { DatePickerSheet } from "@/components/date-picker-sheet";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { OptionPickerSheet } from "@/components/option-picker-sheet";
import { colors, fonts, radius } from "@/constants/theme";
import { toIsoDate } from "@/features/calendar/utils/dates";
import { MONTH_NAMES, startOfDay } from "@/utils/calendar";
import { LOG_COPY } from "../content";
import { useLogging } from "../context/logging-context";
import type { LoggingData } from "../types";
import { MoodPicker } from "./parts/mood-picker";
import { SymptomPills } from "./parts/symptom-pills";

const copy = LOG_COPY.note;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Today, 21 May" or "Fri, 15 May". */
function formatDateChip(date: Date, isToday: boolean): string {
  const prefix = isToday ? copy.today : WEEKDAYS[date.getDay()];
  return `${prefix}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

/** "New note" screen (the tab bar's Add button): mood, symptoms, temperature, flow and free text for one day. */
export function NewNoteScreen() {
  const { data } = useLogging();
  if (!data) return <SafeAreaView style={styles.safe} />;
  return <NoteForm data={data} />;
}

function NoteForm({ data }: { data: LoggingData }) {
  const { entries, saveNote } = useLogging();
  const config = data.note;

  const today = startOfDay(new Date());
  const [date, setDate] = useState(today);
  // Start from what was already logged today, so the note and the "Log today" cards agree.
  const [moodId, setMoodId] = useState<string | null>(entries.mood?.moodId ?? null);
  const [symptomIds, setSymptomIds] = useState<string[]>(entries.symptomIds);
  const [temperature, setTemperature] = useState(entries.temperature ? String(entries.temperature.celsius) : "");
  const [flowId, setFlowId] = useState(config.defaultFlowId);
  const [text, setText] = useState("");

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [flowPickerOpen, setFlowPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isToday = toIsoDate(date) === toIsoDate(today);
  const { min, max } = config.temperature;
  const temperatureValue = temperature.trim() === "" ? undefined : Number(temperature);
  const temperatureInvalid =
    temperatureValue !== undefined && (Number.isNaN(temperatureValue) || temperatureValue < min || temperatureValue > max);

  const hasContent =
    !!moodId || symptomIds.length > 0 || temperatureValue !== undefined || text.trim() !== "" || flowId !== config.defaultFlowId;
  const canSave = hasContent && !temperatureInvalid && !saving;

  const toggleSymptom = (id: string) =>
    setSymptomIds((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveNote({
        kind: "note",
        date: toIsoDate(date),
        moodId: moodId ?? undefined,
        symptomIds: symptomIds.length > 0 ? symptomIds : undefined,
        celsius: temperatureValue,
        flowId,
        text: text.trim() || undefined,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.headRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
            <X size={18} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>{copy.title}</Text>
          <Pressable accessibilityRole="button" onPress={handleSave} disabled={!canSave} hitSlop={8}>
            <Text style={[styles.headSave, !canSave && styles.headSaveDisabled]}>{copy.save}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable accessibilityRole="button" onPress={() => setDatePickerOpen(true)} style={styles.dateChip}>
            <CalendarBlank size={16} color={colors.primary} />
            <Text style={styles.dateText}>{formatDateChip(date, isToday)}</Text>
            <CaretDown size={14} color={colors.primary} />
          </Pressable>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>{copy.feeling}</Text>
            <MoodPicker options={data.mood.options} value={moodId} onChange={setMoodId} />
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>{copy.symptoms}</Text>
            <SymptomPills symptoms={data.symptoms} selected={symptomIds} onToggle={toggleSymptom} />
          </View>

          <View style={styles.tempRow}>
            <View style={styles.half}>
              <TextField
                label={copy.temperatureLabel}
                icon={Thermometer}
                placeholder={copy.temperaturePlaceholder}
                value={temperature}
                onChange={(v) => setTemperature(v.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                error={
                  temperatureInvalid
                    ? copy.temperatureError.replace("{min}", String(min)).replace("{max}", String(max))
                    : undefined
                }
              />
            </View>
            <View style={styles.half}>
              <SelectField
                label={copy.flowLabel}
                icon={Drop}
                value={config.flowOptions.find((o) => o.id === flowId)?.label ?? ""}
                active={flowPickerOpen}
                onPress={() => setFlowPickerOpen(true)}
              />
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>{copy.notes}</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={config.textPlaceholder}
              placeholderTextColor={colors.inkFaint}
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
          </View>

          <ButtonPrimary label={copy.saveEntry} onPress={handleSave} disabled={!canSave} />
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerSheet
        visible={datePickerOpen}
        title="Choose a day"
        value={date}
        minDate={oneYearAgo}
        maxDate={today}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={(d) => {
          setDate(startOfDay(d));
          setDatePickerOpen(false);
        }}
      />

      <OptionPickerSheet
        visible={flowPickerOpen}
        title={copy.flowLabel}
        options={config.flowOptions}
        value={flowId}
        onSelect={setFlowId}
        onClose={() => setFlowPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  headSave: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  headSaveDisabled: { color: colors.inkFaint },
  content: { gap: 26, paddingTop: 26, paddingHorizontal: 20, paddingBottom: 32 },
  dateChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  dateText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  block: { gap: 12 },
  blockTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  tempRow: { flexDirection: "row", gap: 14 },
  half: { flex: 1 },
  textarea: {
    height: 100,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
});
