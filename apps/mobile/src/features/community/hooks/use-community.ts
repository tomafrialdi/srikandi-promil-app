import { useCallback, useEffect, useState } from "react";

import { communityApi } from "../api/community-api";
import type { CommunityFeed } from "../types";

/** Feed of the selected group + optimistic hug toggle (rolled back if the request fails). */
export function useCommunity() {
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [feed, setFeed] = useState<CommunityFeed | null>(null);

  useEffect(() => {
    let cancelled = false;
    communityApi.getFeed(groupId).then((f) => {
      if (!cancelled) setFeed(f);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const toggleHug = useCallback(
    async (postId: string) => {
      const post = feed?.posts.find((p) => p.id === postId);
      if (!feed || !post) return;

      const hugged = !post.hugged;
      const update = (value: boolean, count: number) =>
        setFeed((cur) =>
          cur
            ? { ...cur, posts: cur.posts.map((p) => (p.id === postId ? { ...p, hugged: value, hugCount: count } : p)) }
            : cur,
        );

      update(hugged, post.hugCount + (hugged ? 1 : -1));
      try {
        await communityApi.setHugged(postId, hugged);
      } catch {
        update(post.hugged, post.hugCount);
      }
    },
    [feed],
  );

  return {
    feed,
    /** The highlighted chip: the chosen group, or the first one until the user picks. */
    activeGroupId: groupId ?? feed?.groups[0]?.id ?? "",
    setGroupId,
    toggleHug,
  };
}
