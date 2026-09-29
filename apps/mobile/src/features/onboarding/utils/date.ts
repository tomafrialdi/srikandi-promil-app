/** Formats raw input as "DD / MM / YYYY" while the user types. */
export function maskDate(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return parts.join(" / ");
}

/** "DD / MM / YYYY" -> "YYYY-MM-DD", or null if incomplete / not a real date. */
export function maskedDateToIso(masked: string): string | null {
  const d = masked.replace(/\D/g, "");
  if (d.length !== 8) return null;
  const day = Number(d.slice(0, 2));
  const month = Number(d.slice(2, 4));
  const year = Number(d.slice(4, 8));
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return valid ? `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}` : null;
}
