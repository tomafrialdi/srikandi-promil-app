import type { CheckInMood, Stressor } from "../types";

/** Same five moods as the Mood sheet in the log flow (ids match `user_daily_logs.value`). Lowest first. */
export const CHECK_IN_MOODS: CheckInMood[] = [
  { id: "hard", emoji: "😔", label: "Hard" },
  { id: "low", emoji: "😞", label: "Low" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "good", emoji: "🙂", label: "Good" },
  { id: "great", emoji: "😊", label: "Great" },
];

/** Ids are validated by the database (`app_log_save`); keep them in step. */
export const STRESSORS: Stressor[] = [
  { id: "waiting", label: "The waiting" },
  { id: "family", label: "Family questions" },
  { id: "work", label: "Work stress" },
  { id: "relationship", label: "Relationship" },
  { id: "cost", label: "Cost of treatment" },
  { id: "body", label: "Body changes" },
];

export const COUNSELLOR = {
  title: "Talk to a fertility counsellor",
  description: "Licensed psychologists · chat or video · from Rp75rb",
};
