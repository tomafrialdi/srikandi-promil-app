const pad = (n: number) => String(n).padStart(2, "0");

/** Date -> "YYYY-MM-DD" (local time). */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** (2026, 4) -> "2026-05". `month` is 0-based like Date. */
export function toMonthKey(year: number, month: number): string {
  return `${year}-${pad(month + 1)}`;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}
