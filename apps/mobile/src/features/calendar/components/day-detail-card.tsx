import { Drop, Smiley, Sparkle, type Icon } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { colors, fonts, radius, type Tone } from "@/constants/theme";
import { MONTH_NAMES } from "@/utils/calendar";
import type { CalendarDayData, CalendarPhase } from "../types";

const PHASE_CHIP: Record<CalendarPhase, { label: string; tone: Tone; icon: Icon }> = {
  period: { label: "Period", tone: "primary", icon: Drop },
  fertile: { label: "Fertile", tone: "success", icon: Sparkle },
  ovulation: { label: "Ovulation", tone: "info", icon: Sparkle },
};

interface DayDetailCardProps {
  /** "YYYY-MM-DD" of the selected day. */
  isoDate: string;
  isToday: boolean;
  /** Null while loading or when the backend has nothing for the day. */
  day: CalendarDayData | null;
}

export function DayDetailCard({ isoDate, isToday, day }: DayDetailCardProps) {
  const [, month, dayOfMonth] = isoDate.split("-").map(Number);
  const title = `${MONTH_NAMES[month - 1]} ${dayOfMonth}${isToday ? ", Today" : ""}`;
  const chip = day?.phase ? PHASE_CHIP[day.phase] : null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {day?.cycleDay ? <Text style={styles.subtitle}>Cycle day {day.cycleDay}</Text> : null}
        </View>
        {chip ? <Chip label={chip.label} tone={chip.tone} size="md" icon={chip.icon} /> : null}
      </View>

      <View style={styles.summary}>
        <Smiley size={16} color={colors.inkMuted} />
        <Text style={styles.summaryText}>{day?.summary ?? "Nothing logged for this day"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    gap: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  headText: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  summaryText: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
});
