import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import type { HomeDashboard } from "../types";

interface DailyCheckInCardProps {
  checkIn: HomeDashboard["checkIn"];
  /** Opens the full check-in screen with this mood preselected. */
  onMoodSelect: (moodId: string) => void;
}

/** "How are you feeling today?": tapping an emoji opens the Daily check-in. */
export function DailyCheckInCard({ checkIn, onMoodSelect }: DailyCheckInCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{checkIn.title}</Text>
          <Text style={styles.subtitle}>{checkIn.subtitle}</Text>
        </View>
        <View style={styles.streak}>
          <Text style={styles.streakText}>🔥 {checkIn.streakDays} days</Text>
        </View>
      </View>

      <View style={styles.moods}>
        {checkIn.moods.map((mood) => {
          const active = mood.id === checkIn.selectedMoodId;
          return (
            <Pressable
              key={mood.id}
              accessibilityRole="button"
              accessibilityLabel={mood.label}
              accessibilityState={{ selected: active }}
              onPress={() => onMoodSelect(mood.id)}
              style={[styles.mood, active && styles.moodActive]}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headText: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  streak: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.warningSoft,
  },
  streakText: { fontFamily: fonts.bold, fontSize: 11, color: colors.warningInk },
  moods: { flexDirection: "row", gap: 8 },
  mood: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: colors.surfaceAlt,
  },
  moodActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  emoji: { fontSize: 20 },
});
