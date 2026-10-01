import { MONTH_NAMES } from "@/utils/calendar";

const pad = (n: number) => String(n).padStart(2, "0");

/** Date -> "YYYY-MM-DD" in the phone's time zone. */
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "23 May 2026". */
export const formatDay = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Date -> "HH:MM". */
export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** A date + "HH:MM" typed by the user -> a Date in the phone's time zone. */
export function combine(day: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
}
