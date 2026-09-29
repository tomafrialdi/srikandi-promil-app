import { StyleSheet, View } from "react-native";

import { OptionPill } from "@/components/option-pill";
import type { Option } from "../../types";

const COLUMNS = 3;

interface SymptomPillsProps {
  symptoms: Option[];
  selected: string[];
  onToggle: (symptomId: string) => void;
}

/** Multi-select symptom pills, 3 per row. Shared by the symptom sheet and "New note". */
export function SymptomPills({ symptoms, selected, onToggle }: SymptomPillsProps) {
  const rows: Option[][] = [];
  for (let i = 0; i < symptoms.length; i += COLUMNS) rows.push(symptoms.slice(i, i + COLUMNS));

  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((s) => (
            <OptionPill
              key={s.id}
              label={s.label}
              selected={selected.includes(s.id)}
              onPress={() => onToggle(s.id)}
            />
          ))}
          {Array.from({ length: COLUMNS - row.length }, (_, i) => (
            <View key={`pad-${i}`} style={styles.pad} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: "row", gap: 8 },
  pad: { flex: 1 },
});
