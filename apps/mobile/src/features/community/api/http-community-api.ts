import type { CommunityFeed } from "../types";
import type { CommunityApi } from "./community-api";

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

export const httpCommunityApi: CommunityApi = {
  getFeed: (groupId) => request<CommunityFeed>(`/community/feed${groupId ? `?group=${groupId}` : ""}`),
  setHugged: (postId, hugged) =>
    request<void>(`/community/posts/${postId}/hug`, { method: hugged ? "PUT" : "DELETE" }),
};
