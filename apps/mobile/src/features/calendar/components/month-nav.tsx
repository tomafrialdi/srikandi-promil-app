import { CaretLeft, CaretRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { MONTH_NAMES } from "@/utils/calendar";

interface MonthNavProps {
  year: number;
  month: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function MonthNav({ year, month, onPrevious, onNext }: MonthNavProps) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={onPrevious} style={styles.button}>
        <CaretLeft size={16} color={colors.ink} />
      </Pressable>
      <Text style={styles.label}>
        {MONTH_NAMES[month]} {year}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={onNext} style={styles.button}>
        <CaretRight size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
});
