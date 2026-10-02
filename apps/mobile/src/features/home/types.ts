import type { Tone } from "@/constants/theme";

export type HomeIconName =
  | "thermometer"
  | "smiley"
  | "drop"
  | "pill"
  | "waves"
  | "test-tube"
  | "heart"
  | "scan"
  | "flask"
  | "stethoscope"
  | "pulse";

export interface QuickAction {
  id: string;
  label: string;
  icon: HomeIconName;
  tone: Tone;
}

export interface Mood {
  id: string;
  emoji: string;
  label: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  icon: HomeIconName;
  tone: Tone;
  tag: string;
}

export interface Article {
  id: string;
  category: string;
  title: string;
  readMinutes: number;
  imageUrl: string;
}

export interface Note {
  id: string;
  date: string;
  text: string;
  icon: HomeIconName;
}

export interface CommunityPreview {
  title: string;
  subtitle: string;
  /** Small avatars shown side by side; `tone` picks the color. */
  members: { initial: string; tone: Tone }[];
  latestPost: {
    body: string;
    author: string;
    groupLabel: string;
    /** e.g. "2h". */
    ageLabel: string;
    hugCount: number;
  };
}

/** Everything the Home screen shows. The backend returns this shape. */
export interface HomeDashboard {
  user: { name: string; /** Profile photo; initials are shown when missing. */ avatarUrl?: string | null };
  hasUnreadNotifications: boolean;
  cycle: {
    phaseLabel: string;
    day: number;
    length: number;
    caption: string;
    ctaLabel: string;
  };
  quickActions: { columns: number; items: QuickAction[] };
  checkIn: {
    title: string;
    subtitle: string;
    streakDays: number;
    /** Today's saved check-in mood (highlighted on the card); null when not checked in yet. */
    selectedMoodId: string | null;
    moods: Mood[];
  };
  recommendations: { title: string; subtitle: string; items: Recommendation[] };
  /** `deepLink` makes the tip tappable (set in the console). */
  tip: { title: string; body: string; deepLink?: string | null };
  library: { title: string; subtitle: string; actionLabel: string; articles: Article[] };
  notes: { title: string; actionLabel: string; items: Note[] };
  community: CommunityPreview;
}
