export interface CommunityGroup {
  id: string;
  label: string;
}

export interface CommunityPost {
  id: string;
  /** Anonymous name shown to everyone, e.g. "Melati_Senja". */
  authorAlias: string;
  group: CommunityGroup;
  /** ISO timestamp; the app shows it as "2h", "1d". */
  createdAt: string;
  body: string;
  hugCount: number;
  replyCount: number;
  /** Whether the current user already sent a hug. */
  hugged: boolean;
}

/** What the community screen loads for one group. */
export interface CommunityFeed {
  /** The current user's anonymous alias ("You post as ..."). */
  me: { alias: string };
  groups: CommunityGroup[];
  posts: CommunityPost[];
}
