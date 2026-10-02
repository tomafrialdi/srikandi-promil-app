export type CardLayout = "banner" | "hero" | "bottom_sheet" | "inline_list";

/** Screens that can host in-app cards (matches `app_content_cards`). */
export type CardScreen = "home" | "calendar" | "two_week_wait" | "log_today" | "insights";

/** One in-app card, already resolved to the user's A/B variant by the backend. */
export interface ContentCard {
  id: string;
  layout: CardLayout;
  imageUrl: string | null;
  dismissible: boolean;
  /** Which variant was picked; sent back with impressions and clicks. */
  variant: number;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  deepLink: string | null;
}

export interface DailyTip {
  id: string;
  /** Shown above the text when the tip has both; null for a title-only tip. */
  headline: string | null;
  text: string;
  tapAction: string | null;
  deepLink: string | null;
}

/** Where videos are shown (matches `app_videos`). */
export type VideoPlacement = "feed" | "treatment" | "two_week_wait";

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  durationSeconds: number | null;
  presenter: string | null;
}

export type ContentEvent = "impression" | "click" | "dismiss" | "read";
