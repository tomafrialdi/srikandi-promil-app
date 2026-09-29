import type { LoggingData } from "../types";
import type { LoggingApi } from "./logging-api";

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

export const httpLoggingApi: LoggingApi = {
  getData: () => request<LoggingData>("/logs/today"),
  save: (input) => request<void>("/logs", { method: "POST", body: JSON.stringify(input) }),
};
