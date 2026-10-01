import { User } from "phosphor-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonOutline } from "@/components/button-outline";
import { ButtonPrimary } from "@/components/button-primary";
import { REQUIRED_MESSAGE } from "@/components/form/field-shell";
import { TextField } from "@/components/form/text-field";
import { colors, fonts } from "@/constants/theme";

interface PartnerSheetProps {
  visible: boolean;
  onClose: () => void;
  /** The partner's current name; null when adding. */
  currentName: string | null;
  onSave: (name: string) => Promise<void>;
  onRemove: () => Promise<void>;
}

/** Add the partner, or rename / remove them. */
export function PartnerSheet({ visible, onClose, currentName, onSave, onRemove }: PartnerSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={currentName ? "Partner settings" : "Add your partner"} gap={18}>
      <PartnerForm currentName={currentName} onClose={onClose} onSave={onSave} onRemove={onRemove} />
    </BottomSheet>
  );
}

function PartnerForm({ currentName, onClose, onSave, onRemove }: Omit<PartnerSheetProps, "visible">) {
  const [name, setName] = useState(currentName ?? "");
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string>();

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setFailure(undefined);
    try {
      await action();
      onClose();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError(REQUIRED_MESSAGE);
      return;
    }
    run(() => onSave(name.trim()));
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Partner's name"
        placeholder="e.g. Rizky"
        icon={User}
        value={name}
        onChange={(v) => {
          setName(v.slice(0, 40));
          setNameError(undefined);
        }}
        error={nameError}
        autoCapitalize="words"
      />
      {failure ? <Text style={styles.failure}>{failure}</Text> : null}
      <ButtonPrimary label={currentName ? "Save" : "Add partner"} onPress={handleSave} disabled={saving} />
      {currentName ? (
        <ButtonOutline label="Remove partner" tone="danger" disabled={saving} onPress={() => run(onRemove)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { alignSelf: "stretch", gap: 16 },
  failure: { fontFamily: fonts.medium, fontSize: 12, color: colors.error },
});
