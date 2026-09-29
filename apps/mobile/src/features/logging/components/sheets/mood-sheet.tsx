import { PencilSimpleLine } from "phosphor-react-native";
import { useState } from "react";

import { ButtonPrimary } from "@/components/button-primary";
import { TextField } from "@/components/form/text-field";
import { LinkButton } from "@/components/link-button";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData } from "../../types";
import { MoodPicker } from "../parts/mood-picker";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.mood;

export function MoodSheet({ config }: { config: LoggingData["mood"] }) {
  const { save, entries } = useLogging();
  // Start from what was already logged today (from this sheet or "New note").
  const [moodId, setMoodId] = useState<string | null>(entries.mood?.moodId ?? null);
  const [note, setNote] = useState(entries.mood?.note ?? "");
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
      <MoodPicker options={config.options} value={moodId} onChange={setMoodId} />

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
