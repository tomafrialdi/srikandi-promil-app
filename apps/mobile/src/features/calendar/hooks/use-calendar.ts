import { useCallback, useEffect, useMemo, useState } from "react";

import { calendarApi } from "../api/calendar-api";
import type { CalendarDayData, CalendarMonth } from "../types";
import { toIsoDate, toMonthKey } from "../utils/dates";

/** Visible month + selected day + that month's data from the API. */
export function useCalendar() {
  const today = useMemo(() => new Date(), []);
  const todayIso = toIsoDate(today);

  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [data, setData] = useState<CalendarMonth | null>(null);

  const monthKey = toMonthKey(cursor.year, cursor.month);

  useEffect(() => {
    let cancelled = false;
    calendarApi.getMonth(monthKey).then((m) => {
      if (!cancelled) setData(m);
    });
    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  const shiftMonth = useCallback(
    (delta: number) => {
      const next = new Date(cursor.year, cursor.month + delta, 1);
      setCursor({ year: next.getFullYear(), month: next.getMonth() });
      // Today if it's in the new month, otherwise the 1st.
      const inNewMonth = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth();
      setSelectedDate(inNewMonth ? todayIso : toIsoDate(next));
    },
    [cursor, today, todayIso],
  );

  /** Days of the visible month by "YYYY-MM-DD". Empty while the first load is pending. */
  const daysByDate = useMemo(() => {
    const map = new Map<string, CalendarDayData>();
    if (data && data.month === monthKey) data.days.forEach((d) => map.set(d.date, d));
    return map;
  }, [data, monthKey]);

  return {
    year: cursor.year,
    month: cursor.month,
    todayIso,
    selectedDate,
    setSelectedDate,
    daysByDate,
    selectedDay: daysByDate.get(selectedDate) ?? null,
    previousMonth: () => shiftMonth(-1),
    nextMonth: () => shiftMonth(1),
  };
}
