import type { SpecialistDetail, SpecialistQuery, SpecialistSummary } from "../types";
import { USE_DUMMY_SPECIALISTS } from "./config";
import { dummySpecialistsApi } from "./dummy-specialists-api";
import { httpSpecialistsApi } from "./http-specialists-api";

/**
 * What the specialist screens need from the backend.
 *
 *   GET /specialists?q=<text>&filter=<all|ob-gyn|fertility-clinic|open-now>
 *       -> { data: SpecialistSummary[] }   nearest first (server knows the user's location)
 *   GET /specialists/:id -> SpecialistDetail
 */
export interface SpecialistsApi {
  list(query?: SpecialistQuery): Promise<SpecialistSummary[]>;
  getDetail(id: string): Promise<SpecialistDetail>;
}

/** The single switch between dummy data and the real backend. */
export const specialistsApi: SpecialistsApi = USE_DUMMY_SPECIALISTS
  ? dummySpecialistsApi
  : httpSpecialistsApi;
