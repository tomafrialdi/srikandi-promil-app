import type { SpecialistDetail, SpecialistSummary } from "../types";
import type { SpecialistsApi } from "./specialists-api";

/**
 * Real backend implementation. Fill in `BASE_URL` / auth and it is ready.
 * TODO(backend): base URL from env, and attach the user's access token.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      // TODO(backend): Authorization: `Bearer ${accessToken}`
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${path}`);
  return (await response.json()) as T;
}

export const httpSpecialistsApi: SpecialistsApi = {
  async list({ query = "", filter = "all" } = {}) {
    const params = new URLSearchParams({ q: query, filter });
    const { data } = await request<{ data: SpecialistSummary[] }>(`/specialists?${params}`);
    return data;
  },
  getDetail: (id) => request<SpecialistDetail>(`/specialists/${id}`),
};
