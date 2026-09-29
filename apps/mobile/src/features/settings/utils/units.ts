import type { UnitPreferences } from "../types";

/** "Metric" when everything is metric, "Imperial" when nothing is, otherwise "Custom". */
export function unitsLabel(units: UnitPreferences): string {
  const metric = [units.weight === "kg", units.height === "cm", units.temperature === "c"];
  if (metric.every(Boolean)) return "Metric";
  if (metric.every((m) => !m)) return "Imperial";
  return "Custom";
}
