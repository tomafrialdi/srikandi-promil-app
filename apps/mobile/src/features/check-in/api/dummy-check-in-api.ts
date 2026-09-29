import { delay } from "@/utils/http";
import type { CheckInData, CheckInInput, TodayCheckIn } from "../types";
import type { CheckInApi } from "./check-in-api";

const STREAK_DAYS = 12;

const MOODS = [
  { id: "low", emoji: "😞", label: "Low" },
  { id: "heavy", emoji: "😔", label: "Heavy" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "good", emoji: "🙂", label: "Good" },
  { id: "hopeful", emoji: "😊", label: "Hopeful" },
];

const STRESSORS = [
  { id: "waiting", label: "The waiting" },
  { id: "family", label: "Family questions" },
  { id: "work", label: "Work stress" },
  { id: "relationship", label: "Relationship" },
  { id: "cost", label: "Cost of treatment" },
  { id: "body", label: "Body changes" },
];

/** Moods of the six days before today, oldest first. */
const PAST_WEEK_MOODS = ["hopeful", "good", "okay", "good", "heavy", "okay"];

const pad = (n: number) => String(n).padStart(2, "0");
const isoDaysAgo = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// In-memory so the Home card and this screen stay in sync until the app restarts.
let today: TodayCheckIn = { moodId: null, stressorIds: [], journal: "" };

/** Today's saved mood + streak, for the Home card while there is no backend. */
export const dummyCheckInSummary = () => ({ selectedMoodId: today.moodId, streakDays: STREAK_DAYS });

export const dummyCheckInApi: CheckInApi = {
  async getToday(): Promise<CheckInData> {
    await delay(150);
    const week = [
      ...PAST_WEEK_MOODS.map((moodId, i) => ({ date: isoDaysAgo(PAST_WEEK_MOODS.length - i), moodId })),
      { date: isoDaysAgo(0), moodId: today.moodId },
    ];
    return {
      moods: MOODS,
      stressors: STRESSORS,
      today,
      week,
      streakDays: STREAK_DAYS,
      counsellor: {
        title: "Talk to a fertility counsellor",
        description: "Licensed psychologists · chat or video · from Rp75rb",
      },
    };
  },
  async save(input: CheckInInput) {
    await delay(250);
    today = { moodId: input.moodId, stressorIds: input.stressorIds, journal: input.journal };
  },
};
