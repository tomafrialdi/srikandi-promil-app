import * as Notifications from "expo-notifications";

import { fetchCycleSummary } from "@/features/cycle/api/cycle-api";
import { supabase } from "@/lib/supabase";

/** Where a tap on the reminder goes (`srikandi://…` links, same as the Content library). */
const LINKS = { period: "srikandi://calendar", ovulation: "srikandi://log/lh", daily: "srikandi://log/today" };

/** "YYYY-MM-DD" + a number of days, at the given local hour. */
function localDate(iso: string, addDays: number, hour: number): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d + addDays, hour, 0, 0, 0);
}

interface Prefs {
  notif_period_reminder: boolean;
  notif_ovulation_reminder: boolean;
  notif_daily_log_reminder: boolean;
  discreet_mode: boolean;
}

async function schedule(
  date: Date,
  content: { title: string; body: string; link: string },
  discreet: boolean,
): Promise<void> {
  if (date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    // Discreet mode: nothing about cycles on the lock screen.
    content: {
      title: discreet ? "Srikandi Promil" : content.title,
      body: discreet ? "Daily reminder 🌸 Tap to check in" : content.body,
      data: { deepLink: content.link },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: "reminders" },
  });
}

async function run(): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  // Everything this app schedules locally is a reminder, so replacing them all is safe.
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!permission.granted) return;

  const { data: prefs } = await supabase
    .from("app_users")
    .select("notif_period_reminder,notif_ovulation_reminder,notif_daily_log_reminder,discreet_mode")
    .single<Prefs>();
  if (!prefs) return;
  const discreet = prefs.discreet_mode;

  if (prefs.notif_daily_log_reminder) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: discreet ? "Srikandi Promil" : "How are you today?",
        body: discreet ? "Daily reminder 🌸 Tap to check in" : "Take a minute to log today.",
        data: { deepLink: LINKS.daily },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0, channelId: "reminders" },
    });
  }

  if (!prefs.notif_period_reminder && !prefs.notif_ovulation_reminder) return;
  const cycle = await fetchCycleSummary().catch(() => null);
  if (!cycle || !cycle.hasData) return;

  // This cycle and the next one, so reminders keep coming even if the app isn't opened for a while.
  for (const cycleOffset of [0, cycle.cycleLength]) {
    if (prefs.notif_period_reminder) {
      await schedule(
        localDate(cycle.nextPeriod, cycleOffset - 1, 9),
        {
          title: "Your period may start tomorrow",
          body: "Log it when it begins so your predictions stay accurate.",
          link: LINKS.period,
        },
        discreet,
      );
    }
    if (prefs.notif_ovulation_reminder) {
      await schedule(
        localDate(cycle.fertileStart, cycleOffset, 9),
        {
          title: "Your fertile window opens today",
          body: "Log an LH test or cervical fluid for a sharper prediction.",
          link: LINKS.ovulation,
        },
        discreet,
      );
    }
  }
}

// Calls run one after another, so an update never cancels reminders another call just scheduled.
let queue: Promise<void> = Promise.resolve();

/** Re-plans the reminders from the user's settings and current cycle. Safe to call often. */
export function syncReminders(): Promise<void> {
  queue = queue.then(run).catch((e) => {
    if (__DEV__) console.warn("[reminders] sync failed:", e instanceof Error ? e.message : e);
  });
  return queue;
}

/** On sign-out: no reminders for the account that just left. */
export async function cancelReminders(): Promise<void> {
  queue = queue.then(() => Notifications.cancelAllScheduledNotificationsAsync()).catch(() => undefined);
  await queue;
}
