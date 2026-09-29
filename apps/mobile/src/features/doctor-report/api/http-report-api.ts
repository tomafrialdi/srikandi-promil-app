import { request } from "@/utils/http";
import type { ReportData } from "../types";
import type { ReportApi } from "./report-api";

export const httpReportApi: ReportApi = {
  get: (range) => request<ReportData>(`/report?range=${range}`),
  exportPdf: (body) => request<{ url: string }>("/report/export", { method: "POST", body: JSON.stringify(body) }),
  sendToClinic: (body) => request<void>("/report/send", { method: "POST", body: JSON.stringify(body) }),
};
