export interface CheckInMood {
  id: string;
  emoji: string;
  label: string;
}

export interface Stressor {
  id: string;
  label: string;
}

/** What the user has already saved for today (empty when they haven't checked in yet). */
export interface TodayCheckIn {
  moodId: string | null;
  stressorIds: string[];
  journal: string;
}

/** Everything the Daily check-in screen shows. The backend returns this shape. */
export interface CheckInData {
  moods: CheckInMood[];
  stressors: Stressor[];
  today: TodayCheckIn;
  /** Last 7 days ending today, oldest first. `moodId` is null for days without a check-in. */
  week: { date: string; moodId: string | null }[];
  streakDays: number;
  counsellor: { title: string; description: string };
}

/** Sent to `POST /check-in`. */
export interface CheckInInput {
  moodId: string;
  stressorIds: string[];
  journal: string;
}
