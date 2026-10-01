import { supabaseReportApi } from "./supabase-report-api";
import type { ReportData, ReportRange, ReportRequest } from "../types";

/** Thrown by features that aren't built yet, so the screen can say so instead of faking success. */
export class NotAvailableError extends Error {
  constructor(feature: string) {
    super(`${feature} isn't available yet.`);
    this.name = "NotAvailableError";
  }
}

/**
 * What the Doctor report screen needs from the backend.
 *
 *   RPC `app_report_preview(range)` -> figures from the user's recorded cycles and profile.
 *   exportPdf / sendToClinic       -> not built yet (need server-side PDF + clinic delivery).
 */
export interface ReportApi {
  get(range: ReportRange): Promise<ReportData>;
  exportPdf(request: ReportRequest): Promise<{ url: string }>;
  sendToClinic(request: ReportRequest): Promise<void>;
}

export const reportApi: ReportApi = supabaseReportApi;
