import { Drop, Pulse, Repeat } from "phosphor-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonPrimary } from "@/components/button-primary";
import { ChoiceChips } from "@/components/form/choice-chips";
import { SelectField } from "@/components/form/select-field";
import { NumberPickerSheet } from "@/components/number-picker-sheet";
import { colors, fonts } from "@/constants/theme";
import type { CyclePreferences, CycleRegularity } from "../../types";

const REGULARITY_OPTIONS: { value: CycleRegularity; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "irregular", label: "Irregular" },
  { value: "not_sure", label: "Not sure" },
];

type DayField = "cycleLengthDays" | "periodLengthDays" | "lutealPhaseDays";

const DAY_FIELDS: Record<DayField, { title: string; min: number; max: number }> = {
  cycleLengthDays: { title: "Average cycle length", min: 15, max: 60 },
  periodLengthDays: { title: "Period length", min: 1, max: 14 },
  lutealPhaseDays: { title: "Luteal phase length (advanced)", min: 8, max: 20 },
};

interface CyclePreferencesSheetProps {
  visible: boolean;
  onClose: () => void;
  cycle: CyclePreferences;
  onSave: (cycle: CyclePreferences) => Promise<void>;
}

export function CyclePreferencesSheet({ visible, onClose, cycle, onSave }: CyclePreferencesSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Cycle preferences" gap={18} scrollable>
      <CycleForm cycle={cycle} onClose={onClose} onSave={onSave} />
    </BottomSheet>
  );
}

/** Mounted only while the sheet is open, so it always starts from the saved values. */
function CycleForm({ cycle, onClose, onSave }: Omit<CyclePreferencesSheetProps, "visible">) {
  const [draft, setDraft] = useState<CyclePreferences>(cycle);
  const [picker, setPicker] = useState<DayField | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const pickerConfig = picker ? DAY_FIELDS[picker] : null;

  return (
    <View style={styles.form}>
      <View style={styles.row}>
        <View style={styles.half}>
          <SelectField
            label="Average cycle length"
            icon={Repeat}
            value={String(draft.cycleLengthDays)}
            suffix="days"
            active={picker === "cycleLengthDays"}
            onPress={() => setPicker("cycleLengthDays")}
          />
        </View>
        <View style={styles.half}>
          <SelectField
            label="Period length"
            icon={Drop}
            value={String(draft.periodLengthDays)}
            suffix="days"
            active={picker === "periodLengthDays"}
            onPress={() => setPicker("periodLengthDays")}
          />
        </View>
      </View>

      <SelectField
        label="Luteal phase length (advanced)"
        icon={Pulse}
        value={String(draft.lutealPhaseDays)}
        suffix="days"
        active={picker === "lutealPhaseDays"}
        onPress={() => setPicker("lutealPhaseDays")}
      />

      <View style={styles.regularity}>
        <Text style={styles.regularityLabel}>How regular is your cycle?</Text>
        <ChoiceChips
          options={REGULARITY_OPTIONS}
          value={draft.regularity}
          onChange={(v) => setDraft((d) => ({ ...d, regularity: v as CycleRegularity }))}
        />
      </View>

      <ButtonPrimary label="Save preferences" onPress={handleSave} disabled={saving} />

      {/* Lives inside the form so it stacks on top of this sheet. */}
      {pickerConfig && picker ? (
        <NumberPickerSheet
          visible
          title={pickerConfig.title}
          min={pickerConfig.min}
          max={pickerConfig.max}
          unit="days"
          value={draft[picker]}
          onClose={() => setPicker(null)}
          onConfirm={(n) => {
            setDraft((d) => ({ ...d, [picker]: n }));
            setPicker(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { alignSelf: "stretch", gap: 16 },
  row: { flexDirection: "row", gap: 14 },
  half: { flex: 1 },
  regularity: { gap: 10 },
  regularityLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
});
