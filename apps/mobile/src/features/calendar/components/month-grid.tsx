import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { WEEKDAYS, buildMonthGrid } from "@/utils/calendar";
import type { CalendarDayData, CalendarPhase } from "../types";
import { toIsoDate } from "../utils/dates";

interface MonthGridProps {
  year: number;
  month: number;
  daysByDate: Map<string, CalendarDayData>;
  todayIso: string;
  selectedDate: string;
  onSelect: (isoDate: string) => void;
}

const PHASE_STYLE: Record<CalendarPhase, { bg: string; fg: string }> = {
  period: { bg: colors.primary, fg: colors.white },
  fertile: { bg: colors.primarySoft, fg: colors.primary },
  ovulation: { bg: colors.info, fg: colors.white },
};

/** Weekday header + the month's weeks. Days are tinted by phase; the selected day gets a ring. */
export function MonthGrid({ year, month, daysByDate, todayIso, selectedDate, onSelect }: MonthGridProps) {
  const cells = buildMonthGrid(year, month);
  // buildMonthGrid pads to 6 weeks; drop the trailing weeks that hold no day of this month.
  const weekCount = Math.ceil((cells.findLastIndex((c) => c !== null) + 1) / 7);
  const weeks = Array.from({ length: weekCount }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <View style={styles.card}>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, w) => (
        <View key={w} style={styles.weekRow}>
          {week.map((date, i) => {
            if (!date) return <View key={i} style={styles.cell} />;
            const iso = toIsoDate(date);
            const phase = daysByDate.get(iso)?.phase ?? null;
            const style = phase ? PHASE_STYLE[phase] : null;
            const selected = iso === selectedDate;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={date.toDateString()}
                accessibilityState={{ selected }}
                onPress={() => onSelect(iso)}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.day,
                    style && { backgroundColor: style.bg },
                    selected && styles.daySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      style && { color: style.fg },
                      iso === todayIso && styles.dayTextToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    gap: 12,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  weekRow: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", fontFamily: fonts.bold, fontSize: 11, color: colors.inkFaint },
  cell: { flex: 1, height: 40, alignItems: "center", justifyContent: "center" },
  day: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: { borderColor: colors.ink },
  dayText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  dayTextToday: { fontFamily: fonts.extrabold },
});
