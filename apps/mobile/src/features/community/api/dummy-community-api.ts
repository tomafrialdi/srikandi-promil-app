import dummy from "./dummy-community.json";
import type { CommunityFeed, CommunityGroup, CommunityPost } from "../types";
import type { CommunityApi } from "./community-api";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Dummy rows use `groupId` + `minutesAgo`; converted to real posts (with an ISO `createdAt`) below. */
interface DummyRow extends Omit<CommunityPost, "group" | "createdAt"> {
  groupId: string;
  minutesAgo: number;
}

const groups = dummy.groups as CommunityGroup[];

// In-memory so hugs survive leaving the screen (until the app restarts).
const hugs = new Map<string, { hugged: boolean; count: number }>();

function toPost(row: DummyRow): CommunityPost {
  const { groupId, minutesAgo, ...rest } = row;
  const state = hugs.get(row.id);
  return {
    ...rest,
    hugged: state?.hugged ?? row.hugged,
    hugCount: state?.count ?? row.hugCount,
    group: groups.find((g) => g.id === groupId) ?? groups[0],
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

export const dummyCommunityApi: CommunityApi = {
  async getFeed(groupId) {
    await delay(200);
    const selected = groupId ?? groups[0].id;
    const feed: CommunityFeed = {
      me: dummy.me,
      groups,
      posts: (dummy.posts as DummyRow[]).filter((p) => p.groupId === selected).map(toPost),
    };
    return feed;
  },

  async setHugged(postId, hugged) {
    await delay(80);
    const row = (dummy.posts as DummyRow[]).find((p) => p.id === postId);
    if (!row) return;
    const current = hugs.get(postId) ?? { hugged: row.hugged, count: row.hugCount };
    if (current.hugged === hugged) return;
    hugs.set(postId, { hugged, count: current.count + (hugged ? 1 : -1) });
  },
};
