import { useState } from "react";

import { BottomSheet } from "./bottom-sheet";
import { ButtonPrimary } from "./button-primary";
import { WheelPicker } from "./wheel-picker";

interface NumberPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  title: string;
  min: number;
  max: number;
  step?: number;
  /** Current value; falls back to `initialValue` when the field is empty. */
  value?: number | null;
  initialValue?: number;
  unit?: string;
  confirmLabel?: string;
}

/** Bottom sheet with a roulette-style number wheel. */
export function NumberPickerSheet({
  visible,
  onClose,
  onConfirm,
  title,
  min,
  max,
  step = 1,
  value,
  initialValue,
  unit,
  confirmLabel = "Confirm",
}: NumberPickerSheetProps) {
  const values = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);
  const fallback = initialValue ?? values[Math.floor(values.length / 2)];
  const start = value != null && values.includes(value) ? value : fallback;

  const [draft, setDraft] = useState(start);

  // Reset to the current value each time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(start);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <WheelPicker values={values} value={draft} onChange={setDraft} unit={unit} />
      <ButtonPrimary
        label={confirmLabel}
        onPress={() => onConfirm(draft)}
        style={{ alignSelf: "stretch" }}
      />
    </BottomSheet>
  );
}
