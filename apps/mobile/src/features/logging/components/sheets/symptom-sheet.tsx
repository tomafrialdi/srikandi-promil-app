import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { LinkButton } from "@/components/link-button";
import { OptionPill } from "@/components/option-pill";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.symptom;
const COLUMNS = 3;

export function SymptomSheet({ symptoms }: { symptoms: LoggingData["symptoms"] }) {
  const { save } = useLogging();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));

  const rows: (typeof symptoms)[] = [];
  for (let i = 0; i < symptoms.length; i += COLUMNS) rows.push(symptoms.slice(i, i + COLUMNS));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ kind: "symptom", symptomIds: selected });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent>
      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((s) => (
              <OptionPill
                key={s.id}
                label={s.label}
                selected={selected.includes(s.id)}
                onPress={() => toggle(s.id)}
              />
            ))}
            {Array.from({ length: COLUMNS - row.length }, (_, i) => (
              <View key={`pad-${i}`} style={styles.pad} />
            ))}
          </View>
        ))}
      </View>

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={selected.length === 0 || saving} />
      {/* TODO: open the symptom history screen. */}
      <LinkButton label={copy.history} />
    </SheetContent>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: "row", gap: 8 },
  pad: { flex: 1 },
});
