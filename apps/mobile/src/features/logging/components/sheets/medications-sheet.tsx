import { CheckCircle, Plus } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { LinkButton } from "@/components/link-button";
import { colors, fonts, radius } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.medications;

export function MedicationsSheet({ medications }: { medications: LoggingData["medications"] }) {
  const { save } = useLogging();
  const [takenIds, setTakenIds] = useState(() => medications.filter((m) => m.taken).map((m) => m.id));
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setTakenIds((cur) => (cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ kind: "medications", takenIds });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent>
      <View style={styles.list}>
        {medications.map((med) => {
          const taken = takenIds.includes(med.id);
          return (
            <Pressable
              key={med.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: taken }}
              onPress={() => toggle(med.id)}
              style={[styles.item, taken && styles.itemTaken]}
            >
              {taken ? (
                <CheckCircle size={20} color={colors.success} />
              ) : (
                <View style={styles.emptyCircle} />
              )}
              <View style={styles.text}>
                <Text style={styles.name}>{med.name}</Text>
                <Text style={styles.time}>{med.time}</Text>
              </View>
            </Pressable>
          );
        })}

        {/* TODO: open the add-medication form. */}
        <Pressable accessibilityRole="button" style={styles.add}>
          <Plus size={18} color={colors.primary} />
          <Text style={styles.addLabel}>{copy.add}</Text>
        </Pressable>
      </View>

      <ButtonPrimary label={copy.done} onPress={handleSave} disabled={saving} />
      {/* TODO: open the medications management screen. */}
      <LinkButton label={copy.manage} />
    </SheetContent>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  itemTaken: { borderColor: colors.success, backgroundColor: colors.successSoft },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
  },
  text: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  time: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
  add: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});
