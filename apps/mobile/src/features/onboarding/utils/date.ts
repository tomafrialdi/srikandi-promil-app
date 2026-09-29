import { startOfDay } from "@/utils/calendar";

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

/** Date -> "DD / MM / YYYY" (the format stored in form answers). */
export function formatDate(date: Date): string {
  return `${pad(date.getDate())} / ${pad(date.getMonth() + 1)} / ${date.getFullYear()}`;
}

/** "DD / MM / YYYY" -> Date, or null if incomplete / not a real date. */
export function parseMaskedDate(masked: string | undefined): Date | null {
  const d = (masked ?? "").replace(/\D/g, "");
  if (d.length !== 8) return null;
  const day = Number(d.slice(0, 2));
  const month = Number(d.slice(2, 4));
  const year = Number(d.slice(4, 8));
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : null;
}

/** "DD / MM / YYYY" -> "YYYY-MM-DD", or null if incomplete / not a real date. */
export function maskedDateToIso(masked: string): string | null {
  const date = parseMaskedDate(masked);
  return date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : null;
}

/** Resolves a JSON bound: "today", "-100y", or an ISO date. */
export function resolveDateBound(spec: string | undefined): Date | undefined {
  if (!spec) return undefined;
  const today = startOfDay(new Date());
  if (spec === "today") return today;
  const relative = /^-(\d+)y$/.exec(spec);
  if (relative) return new Date(today.getFullYear() - Number(relative[1]), today.getMonth(), today.getDate());
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(spec);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return undefined;
}
