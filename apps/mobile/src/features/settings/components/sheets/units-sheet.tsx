import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonPrimary } from "@/components/button-primary";
import { SegmentedControl } from "@/components/segmented-control";
import { colors, fonts } from "@/constants/theme";
import type { UnitPreferences } from "../../types";

interface UnitsSheetProps {
  visible: boolean;
  onClose: () => void;
  units: UnitPreferences;
  onSave: (units: UnitPreferences) => Promise<void>;
}

export function UnitsSheet({ visible, onClose, units, onSave }: UnitsSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Units" gap={22}>
      <UnitsForm units={units} onClose={onClose} onSave={onSave} />
    </BottomSheet>
  );
}

function UnitsForm({ units, onClose, onSave }: Omit<UnitsSheetProps, "visible">) {
  const [draft, setDraft] = useState<UnitPreferences>(units);
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

  return (
    <View style={styles.form}>
      <View style={styles.group}>
        <Text style={styles.label}>Weight</Text>
        <SegmentedControl
          options={[
            { value: "kg", label: "kg" },
            { value: "lbs", label: "lbs" },
          ]}
          value={draft.weight}
          onChange={(weight) => setDraft((d) => ({ ...d, weight }))}
        />
      </View>
      <View style={styles.group}>
        <Text style={styles.label}>Height</Text>
        <SegmentedControl
          options={[
            { value: "cm", label: "cm" },
            { value: "in", label: "in" },
          ]}
          value={draft.height}
          onChange={(height) => setDraft((d) => ({ ...d, height }))}
        />
      </View>
      <View style={styles.group}>
        <Text style={styles.label}>Temperature</Text>
        <SegmentedControl
          options={[
            { value: "c", label: "°C" },
            { value: "f", label: "°F" },
          ]}
          value={draft.temperature}
          onChange={(temperature) => setDraft((d) => ({ ...d, temperature }))}
        />
      </View>

      <ButtonPrimary label="Save units" onPress={handleSave} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { alignSelf: "stretch", gap: 22 },
  group: { gap: 10 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
});
