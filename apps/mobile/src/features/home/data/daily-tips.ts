/** General fertility-awareness tips; one is shown per day (rotating by day of the year). */
export const DAILY_TIPS: { title: string; body: string }[] = [
  { title: "Today's tip", body: "Track your temperature at the same time each morning for best accuracy." },
  { title: "Today's tip", body: "Log cervical fluid daily. Slippery, egg-white fluid is one of your clearest fertile signs." },
  { title: "Today's tip", body: "Intimacy every 1–2 days in your fertile window is enough. There's no need for daily pressure." },
  { title: "Today's tip", body: "Folic acid works best when started at least a month before you conceive." },
  { title: "Today's tip", body: "A positive LH test means ovulation is likely within 12–36 hours." },
  { title: "Today's tip", body: "Sleep and stress affect your cycle. A short evening wind-down routine can help." },
  { title: "Today's tip", body: "Stay hydrated and keep caffeine moderate while you're trying to conceive." },
  { title: "Today's tip", body: "Cycles vary by a few days from month to month. That's normal." },
  { title: "Today's tip", body: "Take a pregnancy test from about 12 days after ovulation for the most reliable result." },
  { title: "Today's tip", body: "Be kind to yourself. The waiting is hard, and checking in with how you feel matters too." },
];

/** Same tip all day, a different one tomorrow. */
export function tipFor(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}
