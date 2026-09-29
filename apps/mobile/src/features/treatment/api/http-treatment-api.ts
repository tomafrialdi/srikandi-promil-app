import { request } from "@/utils/http";
import type { TreatmentData } from "../types";
import type { TreatmentApi } from "./treatment-api";

export const httpTreatmentApi: TreatmentApi = {
  get: () => request<TreatmentData>("/treatment"),
  setScheduleDone: (itemId, done) =>
    request<void>(`/treatment/schedule/${itemId}`, { method: "PATCH", body: JSON.stringify({ done }) }),
};
