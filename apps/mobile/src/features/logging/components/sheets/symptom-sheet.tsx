import { useState } from "react";

import { ButtonPrimary } from "@/components/button-primary";
import { LinkButton } from "@/components/link-button";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData } from "../../types";
import { SheetContent } from "../parts/sheet-content";
import { SymptomPills } from "../parts/symptom-pills";

const copy = LOG_COPY.symptom;

export function SymptomSheet({ symptoms }: { symptoms: LoggingData["symptoms"] }) {
  const { save, entries } = useLogging();
  // Start from what was already logged today (from this sheet or "New note").
  const [selected, setSelected] = useState<string[]>(entries.symptomIds);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));

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
      <SymptomPills symptoms={symptoms} selected={selected} onToggle={toggle} />

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={selected.length === 0 || saving} />
      {/* TODO: open the symptom history screen. */}
      <LinkButton label={copy.history} />
    </SheetContent>
  );
}
