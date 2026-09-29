/**
 * Minimal JSON request helper shared by the `http-*-api.ts` files.
 * TODO(backend): base URL from env, and attach the user's access token.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
