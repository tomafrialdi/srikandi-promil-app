import {
  Smiley,
  SmileyAngry,
  SmileyMeh,
  SmileySad,
  SmileyWink,
  type Icon,
} from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { MoodIconName, MoodOption } from "../../types";

const MOOD_ICONS: Record<MoodIconName, Icon> = {
  wink: SmileyWink,
  smile: Smiley,
  meh: SmileyMeh,
  sad: SmileySad,
  angry: SmileyAngry,
};

interface MoodPickerProps {
  options: MoodOption[];
  value: string | null;
  onChange: (moodId: string) => void;
}

/** Row of mood cards (Great ... Hard). Shared by the mood sheet and "New note". */
export function MoodPicker({ options, value, onChange }: MoodPickerProps) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.id === value;
        const MoodIcon = MOOD_ICONS[option.icon];
        const color = selected ? colors.primary : colors.inkFaint;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <MoodIcon size={22} color={color} />
            <Text style={[styles.label, { color }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  label: { fontFamily: fonts.semibold, fontSize: 10 },
});
