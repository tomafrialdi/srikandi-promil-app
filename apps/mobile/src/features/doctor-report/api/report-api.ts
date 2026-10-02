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
 *   RPC `app_report(range)`  -> the report content from the user's cycles and logs.
 *   exportPdf                -> builds the PDF on the phone (expo-print) and returns the local file.
 *   sendToClinic             -> not built yet (needs a clinic to send to).
 */
export interface ReportApi {
  get(range: ReportRange): Promise<ReportData>;
  /** Local file URI of the generated PDF, ready to share. */
  exportPdf(request: ReportRequest): Promise<{ uri: string }>;
  sendToClinic(request: ReportRequest): Promise<void>;
}

export const reportApi: ReportApi = supabaseReportApi;
