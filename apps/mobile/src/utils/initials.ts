/** "Dr. Amelia Wong" -> "AW", "Amara Putri" -> "AP", "Rina Sari, Psi" -> "RS". */
export function initials(name: string): string {
  const cleaned = name.split(",")[0].replace(/^dr\.?\s+/i, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "").concat(words[1]?.[0] ?? "").toUpperCase();
}
