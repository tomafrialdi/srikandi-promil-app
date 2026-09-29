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

/** Everything the Home screen shows. The backend returns this shape. */
export interface HomeDashboard {
  user: { name: string };
  hasUnreadNotifications: boolean;
  cycle: {
    phaseLabel: string;
    day: number;
    length: number;
    caption: string;
    ctaLabel: string;
  };
  quickActions: { columns: number; items: QuickAction[] };
  checkIn: { title: string; subtitle: string; streakDays: number; moods: Mood[] };
  recommendations: { title: string; subtitle: string; items: Recommendation[] };
  tip: { title: string; body: string };
  library: { title: string; subtitle: string; actionLabel: string; articles: Article[] };
  notes: { title: string; actionLabel: string; items: Note[] };
}
