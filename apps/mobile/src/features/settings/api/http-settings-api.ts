import type { Faq, PrivacyPolicy, SettingsSummary } from "../types";
import type { SettingsApi } from "./settings-api";

/**
 * Real backend implementation. Fill in `BASE_URL` / auth and it is ready.
 * TODO(backend): base URL from env, and attach the user's access token.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // TODO(backend): Authorization: `Bearer ${accessToken}`
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${path}`);
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const httpSettingsApi: SettingsApi = {
  getSummary: () => request<SettingsSummary>("/settings/summary"),
  setNotification: (key, enabled) =>
    request<void>("/settings/notifications", { method: "PATCH", body: JSON.stringify({ key, enabled }) }),
  updateProfile: (profile) => request<void>("/profile", { method: "PATCH", body: JSON.stringify(profile) }),
  updateCycle: (cycle) => request<void>("/settings/cycle", { method: "PATCH", body: JSON.stringify(cycle) }),
  updateUnits: (units) => request<void>("/settings/units", { method: "PATCH", body: JSON.stringify(units) }),
  async getFaqs(query = "") {
    const { data } = await request<{ data: Faq[] }>(`/help/faqs?q=${encodeURIComponent(query)}`);
    return data;
  },
  getPrivacyPolicy: () => request<PrivacyPolicy>("/legal/privacy-policy"),
  submitFeedback: (input) => request<void>("/feedback", { method: "POST", body: JSON.stringify(input) }),
};
