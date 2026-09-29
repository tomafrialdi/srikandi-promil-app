import type { CommunityFeed } from "../types";
import { USE_DUMMY_COMMUNITY } from "./config";
import { dummyCommunityApi } from "./dummy-community-api";
import { httpCommunityApi } from "./http-community-api";

/**
 * What the community screen needs from the backend.
 *
 *   GET    /community/feed?group=<id> -> CommunityFeed   (omit `group` for the user's first group)
 *   PUT    /community/posts/:id/hug   -> 204
 *   DELETE /community/posts/:id/hug   -> 204
 */
export interface CommunityApi {
  getFeed(groupId?: string): Promise<CommunityFeed>;
  setHugged(postId: string, hugged: boolean): Promise<void>;
}

/** The single switch between dummy data and the real backend. */
export const communityApi: CommunityApi = USE_DUMMY_COMMUNITY ? dummyCommunityApi : httpCommunityApi;
