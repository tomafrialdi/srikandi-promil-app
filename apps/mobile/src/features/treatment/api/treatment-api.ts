import { USE_DUMMY_API } from "@/config/api";
import type { TreatmentData } from "../types";
import { dummyTreatmentApi } from "./dummy-treatment-api";
import { httpTreatmentApi } from "./http-treatment-api";

/**
 * What the My treatment screen needs from the backend.
 *
 *   GET   /treatment                     -> TreatmentData
 *   PATCH /treatment/schedule/:id        body: { done } -> 204
 */
export interface TreatmentApi {
  get(): Promise<TreatmentData>;
  setScheduleDone(itemId: string, done: boolean): Promise<void>;
}

export const treatmentApi: TreatmentApi = USE_DUMMY_API ? dummyTreatmentApi : httpTreatmentApi;
