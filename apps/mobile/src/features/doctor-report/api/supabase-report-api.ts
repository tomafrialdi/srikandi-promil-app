import { supabase } from "@/lib/supabase";
import { MONTH_NAMES } from "@/utils/calendar";
import type { ReportData, ReportPreview, ReportRange } from "../types";
import { NotAvailableError, type ReportApi } from "./report-api";

interface PreviewRow {
  name: string;
  ageYears: number | null;
  cycleCount: number;
  /** "YYYY-MM-DD" of the oldest cycle included, or null. */
  firstCycleStart: string | null;
  stats: ReportPreview["stats"];
}

/** "Dec 2025 – May 2026 · 6 cycles", from the first included cycle to this month. */
function rangeLabel(row: PreviewRow): string {
  if (row.cycleCount === 0 || !row.firstCycleStart) return "No cycles recorded yet";
  const short = (d: Date) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  const [y, m, day] = row.firstCycleStart.split("-").map(Number);
  const cycles = `${row.cycleCount} ${row.cycleCount === 1 ? "cycle" : "cycles"}`;
  return `${short(new Date(y, m - 1, day))} – ${short(new Date())} · ${cycles}`;
}

export const supabaseReportApi: ReportApi = {
  async get(range: ReportRange): Promise<ReportData> {
    const { data, error } = await supabase.rpc("app_report_preview", { p_range: range });
    if (error) throw new Error(error.message);
    const row = data as PreviewRow;

    return {
      preview: {
        name: row.name,
        ageYears: row.ageYears,
        rangeLabel: rangeLabel(row),
        stats: row.stats,
        // Temperature, test and symptom logs aren't stored server-side yet.
        bbt: null,
        flag: null,
      },
      include: {
        cycleHistory: true,
        bbt: true,
        tests: true,
        fluidSymptoms: true,
        medications: true,
        intimacy: false,
        notes: false,
      },
    };
  },

  async exportPdf() {
    throw new NotAvailableError("PDF export");
  },

  async sendToClinic() {
    throw new NotAvailableError("Sending to your clinic");
  },
};
