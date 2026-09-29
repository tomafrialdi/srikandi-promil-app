import { USE_DUMMY_API } from "@/config/api";
import type { ReportData, ReportRange, ReportRequest } from "../types";
import { dummyReportApi } from "./dummy-report-api";
import { httpReportApi } from "./http-report-api";

/**
 * What the Doctor report screen needs from the backend.
 *
 *   GET  /report?range=<last-3|last-6|all> -> ReportData
 *   POST /report/export  body: ReportRequest -> { url }   (PDF download link)
 *   POST /report/send    body: ReportRequest -> 204       (emails it to the user's clinic)
 */
export interface ReportApi {
  get(range: ReportRange): Promise<ReportData>;
  exportPdf(request: ReportRequest): Promise<{ url: string }>;
  sendToClinic(request: ReportRequest): Promise<void>;
}

export const reportApi: ReportApi = USE_DUMMY_API ? dummyReportApi : httpReportApi;
