import { SlidersHorizontal } from "phosphor-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconButton } from "@/components/icon-button";
import { useTabBarClearance } from "@/components/tab-bar/tab-bar";
import { colors, fonts } from "@/constants/theme";
import { useCalendar } from "../hooks/use-calendar";
import { CalendarLegend } from "./calendar-legend";
import { DayDetailCard } from "./day-detail-card";
import { MonthGrid } from "./month-grid";
import { MonthNav } from "./month-nav";

/** Calendar tab: month grid tinted by cycle phase, and details of the selected day. */
export function CalendarScreen() {
  const calendar = useCalendar();
  const bottomClearance = useTabBarClearance();

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <Text style={styles.title}>Calendar</Text>
          {/* TODO: open cycle settings (cycle length, period length ...). */}
          <IconButton icon={SlidersHorizontal} label="Calendar settings" />
        </View>

        <MonthNav
          year={calendar.year}
          month={calendar.month}
          onPrevious={calendar.previousMonth}
          onNext={calendar.nextMonth}
        />

        <CalendarLegend />

        <MonthGrid
          year={calendar.year}
          month={calendar.month}
          daysByDate={calendar.daysByDate}
          todayIso={calendar.todayIso}
          selectedDate={calendar.selectedDate}
          onSelect={calendar.setSelectedDate}
        />

        <DayDetailCard
          isoDate={calendar.selectedDate}
          isToday={calendar.selectedDate === calendar.todayIso}
          day={calendar.selectedDay}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 22, paddingTop: 8, paddingHorizontal: 20 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
});
