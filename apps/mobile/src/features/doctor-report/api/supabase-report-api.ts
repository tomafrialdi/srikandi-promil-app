import * as Print from "expo-print";

import { toIsoDate } from "@/features/calendar/utils/dates";
import { treatmentApi } from "@/features/treatment/api/treatment-api";
import { supabase } from "@/lib/supabase";
import { MONTH_NAMES } from "@/utils/calendar";
import type { ReportData, ReportDetails, ReportPreview, ReportRange, ReportRequest } from "../types";
import { buildReportHtml } from "../utils/report-html";
import { NotAvailableError, type ReportApi } from "./report-api";

type ReportRow = ReportDetails & {
  name: string;
  ageYears: number | null;
  cycleCount: number;
  /** "YYYY-MM-DD" of the oldest cycle included, or null. */
  firstCycleStart: string | null;
  stats: ReportPreview["stats"];
  bbt: ReportPreview["bbt"];
  flag: string | null;
};

/** "Dec 2025 – May 2026 · 6 cycles", from the first included cycle to this month. */
function rangeLabel(row: ReportRow): string {
  if (row.cycleCount === 0 || !row.firstCycleStart) return "No cycles recorded yet";
  const short = (d: Date) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  const [y, m, day] = row.firstCycleStart.split("-").map(Number);
  const cycles = `${row.cycleCount} ${row.cycleCount === 1 ? "cycle" : "cycles"}`;
  return `${short(new Date(y, m - 1, day))} – ${short(new Date())} · ${cycles}`;
}

async function load(range: ReportRange): Promise<ReportData> {
  const { data, error } = await supabase.rpc("app_report", { p_range: range, p_today: toIsoDate(new Date()) });
  if (error) throw new Error(error.message);
  const row = data as ReportRow;

  return {
    preview: {
      name: row.name,
      ageYears: row.ageYears,
      rangeLabel: rangeLabel(row),
      stats: row.stats,
      bbt: row.bbt,
      flag: row.flag,
    },
    details: {
      cycles: row.cycles,
      tests: row.tests,
      fluid: row.fluid,
      symptoms: row.symptoms,
      intimacy: row.intimacy,
      notes: row.notes,
    },
    // Private sections start off; the user opts in.
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
}

export const supabaseReportApi: ReportApi = {
  get: load,

  /** Builds the PDF on the phone from fresh data and returns its local file. */
  async exportPdf(request: ReportRequest) {
    const report = await load(request.range);
    // Medications come from the user's active treatment program (none = an empty section).
    const treatment = await treatmentApi.get().catch(() => null);
    const medications = (treatment?.schedule ?? [])
      .filter((item) => item.kind === "medication")
      .map((item) => ({ title: item.title, description: item.description }));

    const html = buildReportHtml({
      preview: report.preview,
      details: report.details,
      include: request.include,
      medications,
    });
    const { uri } = await Print.printToFileAsync({ html });
    return { uri };
  },

  async sendToClinic() {
    throw new NotAvailableError("Sending to your clinic");
  },
};
