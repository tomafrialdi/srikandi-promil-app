import { MONTH_NAMES } from "@/utils/calendar";

/** "2026-05-18" -> "May 18, 2026". */
export function formatPublishedDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTH_NAMES[month - 1].slice(0, 3)} ${day}, ${year}`;
}

/** "Dr. Amelia Wong" -> "AW", "Rina Sari, Psi" -> "RS". */
export function authorInitials(name: string): string {
  const cleaned = name.split(",")[0].replace(/^dr\.?\s+/i, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "").concat(words[1]?.[0] ?? "").toUpperCase();
}
