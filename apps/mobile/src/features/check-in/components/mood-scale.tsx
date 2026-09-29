import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { CheckInMood } from "../types";

interface MoodScaleProps {
  moods: CheckInMood[];
  value: string | null;
  onChange: (moodId: string) => void;
}

/** Five emoji cards from Low to Hopeful. */
export function MoodScale({ moods, value, onChange }: MoodScaleProps) {
  return (
    <View style={styles.row}>
      {moods.map((mood) => {
        const selected = mood.id === value;
        return (
          <Pressable
            key={mood.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(mood.id)}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>{mood.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  emoji: { fontSize: 24 },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkMuted },
  labelSelected: { color: colors.primary },
});
