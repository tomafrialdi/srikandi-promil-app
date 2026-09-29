import { CaretDown, CaretLeft, CaretRight } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import {
  MONTH_NAMES,
  WEEKDAYS,
  buildMonthGrid,
  isSameDay,
  startOfDay,
} from "@/utils/calendar";
import { BottomSheet } from "./bottom-sheet";
import { ButtonPrimary } from "./button-primary";

const CELL = 40;
const WEEK_HEAD = 16;
const BODY_HEIGHT = WEEK_HEAD + 8 + CELL * 6;

interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  value?: Date | null;
  title?: string;
  confirmLabel?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePickerSheet({
  visible,
  onClose,
  onConfirm,
  value,
  title = "Select date",
  confirmLabel = "Confirm",
  minDate,
  maxDate,
}: DatePickerSheetProps) {
  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : undefined;
  const max = maxDate ? startOfDay(maxDate) : undefined;

  const [selected, setSelected] = useState<Date | null>(value ?? null);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [mode, setMode] = useState<"days" | "years">("days");

  // Reset to the current value each time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      const anchor = value ?? (max && today > max ? max : today);
      setSelected(value ?? null);
      setCursor({ year: anchor.getFullYear(), month: anchor.getMonth() });
      setMode("days");
    }
  }

  const cells = buildMonthGrid(cursor.year, cursor.month);

  const minYear = (min ?? new Date(today.getFullYear() - 100, 0, 1)).getFullYear();
  const maxYear = (max ?? new Date(today.getFullYear() + 5, 0, 1)).getFullYear();
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  const canGoPrev = !min || new Date(cursor.year, cursor.month, 0) >= min;
  const canGoNext = !max || new Date(cursor.year, cursor.month + 1, 1) <= max;

  const shiftMonth = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const pickYear = (year: number) => {
    let month = cursor.month;
    if (max && year === max.getFullYear()) month = Math.min(month, max.getMonth());
    if (min && year === min.getFullYear()) month = Math.max(month, min.getMonth());
    setCursor({ year, month });
    setMode("days");
  };

  const isDisabled = (d: Date) => (min && d < min) || (max && d > max);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.monthRow}>
        <NavButton disabled={mode === "years" || !canGoPrev} onPress={() => shiftMonth(-1)}>
          <CaretLeft size={16} color={colors.ink} />
        </NavButton>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode(mode === "days" ? "years" : "days")}
          style={styles.monthLabelWrap}
        >
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[cursor.month]} {cursor.year}
          </Text>
          <CaretDown size={14} color={colors.inkMuted} />
        </Pressable>
        <NavButton disabled={mode === "years" || !canGoNext} onPress={() => shiftMonth(1)}>
          <CaretRight size={16} color={colors.ink} />
        </NavButton>
      </View>

      <View style={styles.body}>
        {mode === "days" ? (
          <>
            <View style={styles.weekHead}>
              {WEEKDAYS.map((d, i) => (
                <Text key={i} style={styles.weekday}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {cells.map((date, i) => {
                if (!date) return <View key={i} style={styles.cell} />;
                const isSelected = !!selected && isSameDay(date, selected);
                const isToday = isSameDay(date, today);
                const disabled = !!isDisabled(date);
                return (
                  <Pressable
                    key={i}
                    disabled={disabled}
                    onPress={() => setSelected(date)}
                    style={styles.cell}
                  >
                    <View
                      style={[
                        styles.day,
                        isToday && !isSelected && styles.dayToday,
                        isSelected && styles.daySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          disabled && styles.dayTextDisabled,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.yearGrid}>
              {years.map((year) => {
                const active = year === cursor.year;
                return (
                  <Pressable
                    key={year}
                    onPress={() => pickYear(year)}
                    style={[styles.year, active && styles.yearActive]}
                  >
                    <Text style={[styles.yearText, active && styles.yearTextActive]}>
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      <ButtonPrimary
        label={confirmLabel}
        disabled={!selected}
        onPress={() => selected && onConfirm(selected)}
        style={styles.confirm}
      />
    </BottomSheet>
  );
}

function NavButton({
  disabled,
  onPress,
  children,
}: {
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.nav, disabled && styles.navDisabled]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  monthLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  nav: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  navDisabled: { opacity: 0.35 },
  body: { alignSelf: "stretch", height: BODY_HEIGHT },
  weekHead: { flexDirection: "row", height: WEEK_HEAD, marginBottom: 8 },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.inkFaint,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    height: CELL,
    alignItems: "center",
    justifyContent: "center",
  },
  day: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: { borderWidth: 1.5, borderColor: colors.ink },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  dayTextDisabled: { color: colors.inkFaint, opacity: 0.5 },
  dayTextSelected: { color: colors.white },
  yearGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  year: {
    width: "22.5%",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  yearActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  yearText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
  yearTextActive: { color: colors.primary },
  confirm: { alignSelf: "stretch" },
});
