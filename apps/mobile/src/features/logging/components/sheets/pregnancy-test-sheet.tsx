import { CaretRight, Camera, CircleDashed, Minus, Plus, Timer, type Icon } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { OptionPill } from "@/components/option-pill";
import { colors, fonts, radius, tones } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData, PregnancyResultIcon } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.pregnancyTest;

const RESULT_ICONS: Record<PregnancyResultIcon, Icon> = {
  minus: Minus,
  "circle-dashed": CircleDashed,
  plus: Plus,
};

export function PregnancyTestSheet({ config }: { config: LoggingData["pregnancyTest"] }) {
  const { save } = useLogging();
  const [resultId, setResultId] = useState<string | null>(null);
  const [testTypeId, setTestTypeId] = useState(config.testTypes[0].id);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!resultId) return;
    setSaving(true);
    try {
      await save({ kind: "pregnancy-test", resultId, testTypeId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent>
      {config.warning ? (
        <View style={styles.warning}>
          <Timer size={16} color={colors.warning} />
          <Text style={styles.warningText}>{config.warning}</Text>
        </View>
      ) : null}

      <Text style={styles.question}>{copy.resultQuestion}</Text>
      <View style={styles.results}>
        {config.results.map((result) => {
          const selected = result.id === resultId;
          const ResultIcon = RESULT_ICONS[result.icon];
          const tone = tones[result.tone];
          return (
            <Pressable
              key={result.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setResultId(result.id)}
              style={[styles.result, selected && styles.resultSelected]}
            >
              <View style={[styles.resultIcon, { backgroundColor: tone.bg }]}>
                <ResultIcon size={16} color={tone.fg} />
              </View>
              <Text style={[styles.resultLabel, selected && styles.resultLabelSelected]}>
                {result.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.question}>{copy.typeQuestion}</Text>
      <View style={styles.types}>
        {config.testTypes.map((type) => (
          <OptionPill
            key={type.id}
            label={type.label}
            selected={type.id === testTypeId}
            onPress={() => setTestTypeId(type.id)}
          />
        ))}
      </View>

      {/* TODO: open the camera (expo-camera) and attach the photo to this log. */}
      <Pressable accessibilityRole="button" style={styles.photo}>
        <View style={styles.photoIcon}>
          <Camera size={16} color={colors.ink} />
        </View>
        <View style={styles.photoText}>
          <Text style={styles.photoTitle}>{config.photo.title}</Text>
          <Text style={styles.photoDescription}>{config.photo.description}</Text>
        </View>
        <CaretRight size={16} color={colors.inkFaint} />
      </Pressable>

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={!resultId || saving} />
    </SheetContent>
  );
}

const styles = StyleSheet.create({
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  warningText: { flex: 1, fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16, color: colors.warningInk },
  question: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  results: { flexDirection: "row", gap: 10 },
  result: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  resultSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  resultLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  resultLabelSelected: { color: colors.primary },
  types: { flexDirection: "row", gap: 8 },
  photo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  photoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  photoText: { flex: 1, gap: 2 },
  photoTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  photoDescription: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
});
