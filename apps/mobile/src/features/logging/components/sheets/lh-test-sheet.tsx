import { CalendarHeart, Camera, Check } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { InsightCard } from "@/components/insight-card";
import { OptionPill } from "@/components/option-pill";
import { colors, fonts, radius } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData } from "../../types";
import { LhStripPreview } from "../parts/lh-strip-preview";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.lhTest;

export function LhTestSheet({ config }: { config: LoggingData["lhTest"] }) {
  const { save } = useLogging();
  const [resultId, setResultId] = useState<string | null>(config.reading?.resultId ?? null);
  const [saving, setSaving] = useState(false);

  const selected = config.results.find((r) => r.id === resultId);

  const handleSave = async () => {
    if (!resultId) return;
    setSaving(true);
    try {
      await save({ kind: "lh-test", resultId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent>
      <View style={styles.scanCard}>
        <LhStripPreview />

        {config.reading ? (
          <View style={styles.readingRow}>
            <View style={styles.reading}>
              <Text style={styles.readingLabel}>{copy.aiReading}</Text>
              <Text style={styles.readingValue}>{config.reading.label}</Text>
            </View>
            <View style={styles.confidence}>
              <Check size={12} color={colors.success} />
              <Text style={styles.confidenceText}>
                {copy.match.replace("{percent}", String(config.reading.confidencePercent))}
              </Text>
            </View>
          </View>
        ) : null}

        {/* TODO: open the camera (expo-camera) and send the photo for AI reading. */}
        <Pressable accessibilityRole="button" style={styles.retake}>
          <Camera size={14} color={colors.ink} />
          <Text style={styles.retakeLabel}>{copy.retake}</Text>
        </Pressable>
      </View>

      <Text style={styles.manualLabel}>{copy.manual}</Text>
      <View style={styles.pills}>
        {config.results.map((r) => (
          <OptionPill
            key={r.id}
            label={r.label}
            selected={r.id === resultId}
            onPress={() => setResultId(r.id)}
          />
        ))}
      </View>

      {selected ? <InsightCard icon={CalendarHeart} tone="primary" text={selected.insight} /> : null}

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={!resultId || saving} />
    </SheetContent>
  );
}

const styles = StyleSheet.create({
  scanCard: {
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  readingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  reading: { flex: 1, gap: 2 },
  readingLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkFaint },
  readingValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  confidence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
  },
  confidenceText: { fontFamily: fonts.bold, fontSize: 11, color: colors.success },
  retake: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  retakeLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  manualLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
  pills: { flexDirection: "row", gap: 8 },
});
