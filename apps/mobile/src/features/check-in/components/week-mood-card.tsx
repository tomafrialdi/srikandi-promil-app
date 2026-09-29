import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { CheckInMood } from "../types";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

interface WeekMoodCardProps {
  week: { date: string; moodId: string | null }[];
  moods: CheckInMood[];
  streakDays: number;
}

/** "Your week": the last seven days as emojis, plus the current streak. */
export function WeekMoodCard({ week, moods, streakDays }: WeekMoodCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Your week</Text>
        <Text style={styles.streak}>🔥 {streakDays}-day streak</Text>
      </View>
      <View style={styles.days}>
        {week.map((day) => {
          const [y, m, d] = day.date.split("-").map(Number);
          const mood = moods.find((x) => x.id === day.moodId);
          return (
            <View key={day.date} style={styles.day}>
              <Text style={[styles.emoji, !mood && styles.emojiEmpty]}>{mood?.emoji ?? "·"}</Text>
              <Text style={styles.weekday}>{WEEKDAY_INITIALS[new Date(y, m - 1, d).getDay()]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  head: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  streak: { fontFamily: fonts.bold, fontSize: 11, color: colors.warning },
  days: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", gap: 4 },
  emoji: { fontSize: 18 },
  emojiEmpty: { color: colors.inkFaint },
  weekday: { fontFamily: fonts.semibold, fontSize: 10, color: colors.inkFaint },
});
