import { MONTH_NAMES } from "@/utils/calendar";
import { delay } from "@/utils/http";
import type { ReportData, ReportPreview, ReportRange } from "../types";
import type { ReportApi } from "./report-api";

const CYCLES: Record<ReportRange, number> = { "last-3": 3, "last-6": 6, all: 8 };

const STATS: Record<ReportRange, ReportPreview["stats"]> = {
  "last-3": [
    { label: "Avg. cycle", value: "28 days" },
    { label: "Luteal phase", value: "12 days" },
    { label: "Ovulation confirmed", value: "3 of 3" },
    { label: "Trying for", value: "8 months" },
  ],
  "last-6": [
    { label: "Avg. cycle", value: "29 days" },
    { label: "Luteal phase", value: "12 days" },
    { label: "Ovulation confirmed", value: "5 of 6" },
    { label: "Trying for", value: "8 months" },
  ],
  all: [
    { label: "Avg. cycle", value: "29 days" },
    { label: "Luteal phase", value: "12 days" },
    { label: "Ovulation confirmed", value: "6 of 8" },
    { label: "Trying for", value: "8 months" },
  ],
};

const TEMPS = [
  36.47, 36.36, 36.47, 36.41, 36.36, 36.47, 36.41, 36.36, 36.47, 36.41, 36.36, 36.3, 36.23, 36.36, 36.71, 36.84, 36.9,
  36.96, 36.84, 36.96, 36.9,
];

/** "Dec 2025 – May 2026 · 6 cycles", counted back from this month. */
function rangeLabel(range: ReportRange): string {
  const cycles = CYCLES[range];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (cycles - 1), 1);
  const short = (d: Date) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  return `${short(start)} – ${short(now)} · ${cycles} cycles`;
}

export const dummyReportApi: ReportApi = {
  async get(range): Promise<ReportData> {
    await delay(200);
    return {
      preview: {
        name: "Amara Putri",
        ageYears: 31,
        rangeLabel: rangeLabel(range),
        stats: STATS[range],
        bbt: { title: "BBT · current cycle", biphasic: true, ovulationDay: 14, temps: TEMPS },
        flag: "Discuss: 1 anovulatory cycle (Feb), spotting 2 days before period in 3 cycles.",
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
  async exportPdf(request) {
    await delay(500);
    console.log("[report] export", JSON.stringify(request));
    return { url: "https://example.invalid/report.pdf" };
  },
  async sendToClinic(request) {
    await delay(500);
    console.log("[report] send", JSON.stringify(request));
  },
};
