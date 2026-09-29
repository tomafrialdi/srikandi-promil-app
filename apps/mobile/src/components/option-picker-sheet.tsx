import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { BottomSheet } from "./bottom-sheet";

interface OptionPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { id: string; label: string }[];
  value: string;
  /** Called with the tapped option; the sheet closes afterwards. */
  onSelect: (id: string) => void;
}

/** Bottom sheet with a single-select list (radio rows). Tapping a row selects and closes. */
export function OptionPickerSheet({ visible, onClose, title, options, value, onSelect }: OptionPickerSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.list}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                onSelect(option.id);
                onClose();
              }}
              style={[styles.row, selected && styles.rowSelected]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]} />
              <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { alignSelf: "stretch", gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    backgroundColor: colors.card,
  },
  radioSelected: { borderWidth: 5, borderColor: colors.primary },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  labelSelected: { color: colors.primary },
});
