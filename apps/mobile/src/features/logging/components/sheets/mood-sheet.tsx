import {
  PencilSimpleLine,
  Smiley,
  SmileyAngry,
  SmileyMeh,
  SmileySad,
  SmileyWink,
  type Icon,
} from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { TextField } from "@/components/form/text-field";
import { LinkButton } from "@/components/link-button";
import { colors, fonts } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData, MoodIconName } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.mood;

const MOOD_ICONS: Record<MoodIconName, Icon> = {
  wink: SmileyWink,
  smile: Smiley,
  meh: SmileyMeh,
  sad: SmileySad,
  angry: SmileyAngry,
};

export function MoodSheet({ config }: { config: LoggingData["mood"] }) {
  const { save } = useLogging();
  const [moodId, setMoodId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!moodId) return;
    setSaving(true);
    try {
      await save({ kind: "mood", moodId, note: note.trim() || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent>
      <View style={styles.row}>
        {config.options.map((option) => {
          const selected = option.id === moodId;
          const MoodIcon = MOOD_ICONS[option.icon];
          const color = selected ? colors.primary : colors.inkFaint;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setMoodId(option.id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <MoodIcon size={22} color={color} />
              <Text style={[styles.label, { color }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label={copy.noteLabel}
        icon={PencilSimpleLine}
        placeholder={config.notePlaceholder}
        value={note}
        onChange={setNote}
        autoCapitalize="sentences"
      />

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={!moodId || saving} />
      {/* TODO: open the mood history screen. */}
      <LinkButton label={copy.history} />
    </SheetContent>
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

