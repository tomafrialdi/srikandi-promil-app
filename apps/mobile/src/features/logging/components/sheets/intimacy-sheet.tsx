import { Heart, TrendUp } from "phosphor-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { InsightCard } from "@/components/insight-card";
import { OptionPill } from "@/components/option-pill";
import { colors, fonts, radius } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { IntimacyDay, LoggingData } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.intimacy;

export function IntimacySheet({ config }: { config: LoggingData["intimacy"] }) {
  const { save } = useLogging();
  const [hadIntimacy, setHadIntimacy] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (hadIntimacy === null) return;
    setSaving(true);
    try {
      await save({ kind: "intimacy", hadIntimacy });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent>
      <Text style={styles.subtitle}>{config.subtitle}</Text>

      <View style={styles.toggle}>
        <OptionPill label={copy.yes} selected={hadIntimacy === true} onPress={() => setHadIntimacy(true)} />
        <OptionPill label={copy.no} selected={hadIntimacy === false} onPress={() => setHadIntimacy(false)} />
      </View>

      <View style={styles.timingCard}>
        <View style={styles.timingHead}>
          <Text style={styles.timingTitle}>{copy.timingTitle}</Text>
          <Text style={styles.score}>
            {copy.score
              .replace("{done}", String(config.score.done))
              .replace("{total}", String(config.score.total))}
          </Text>
        </View>

        <View style={styles.days}>
          {config.days.map((day) => (
            <DayColumn key={`${day.weekday}-${day.date}`} day={day} />
          ))}
        </View>

        <View style={styles.legend}>
          <LegendItem color={colors.primary} label={copy.legendLogged} />
          <LegendItem color={colors.primaryTintStrong} label={copy.legendBest} />
        </View>
      </View>

      <InsightCard icon={TrendUp} tone="success" text={config.insight} />

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={hadIntimacy === null || saving} />
    </SheetContent>
  );
}

function DayColumn({ day }: { day: IntimacyDay }) {
  return (
    <View style={styles.day}>
      <Text style={styles.weekday}>{day.weekday}</Text>
      <View style={[styles.dot, DOT_STYLE[day.status]]}>
        {day.status === "logged" ? (
          <Heart size={14} weight="fill" color={colors.white} />
        ) : (
          <Text style={[styles.dayNumber, day.status === "today" && styles.dayNumberToday]}>
            {day.date}
          </Text>
        )}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const DOT_STYLE = StyleSheet.create({
  logged: { backgroundColor: colors.primary },
  today: { backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primary },
  best: { backgroundColor: colors.primaryTint },
  none: { backgroundColor: colors.surfaceAlt },
});

const styles = StyleSheet.create({
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  toggle: { flexDirection: "row", gap: 8 },
  timingCard: {
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  timingHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timingTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  score: { fontFamily: fonts.bold, fontSize: 13, color: colors.success },
  days: { flexDirection: "row", gap: 6 },
  day: { flex: 1, alignItems: "center", gap: 6 },
  weekday: { fontFamily: fonts.semibold, fontSize: 10, color: colors.inkFaint },
  dot: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkMuted },
  dayNumberToday: { color: colors.primary },
  legend: { flexDirection: "row", alignItems: "center", gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 8, height: 8, borderRadius: radius.pill },
  legendLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
});
