import { Cake, Envelope, Ruler, Scales, User } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonPrimary } from "@/components/button-primary";
import { DatePickerSheet } from "@/components/date-picker-sheet";
import { REQUIRED_MESSAGE } from "@/components/form/field-shell";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { NumberPickerSheet } from "@/components/number-picker-sheet";
import { colors, fonts, radius } from "@/constants/theme";
import { MONTH_NAMES, startOfDay } from "@/utils/calendar";
import { initials } from "@/utils/initials";
import type { Profile } from "../types";

const MIN_AGE = 18;
const MIN_AGE_MESSAGE = "You need to be at least 18 years old to use Srikandi Promil.";

interface PersonalInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (profile: Profile) => Promise<void>;
}

/** Bottom sheet to edit name, birth date, height and weight (email is shown read-only). */
export function PersonalInfoSheet({ visible, onClose, profile, onSave }: PersonalInfoSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Personal information" gap={18} scrollable>
      <PersonalInfoForm profile={profile} onClose={onClose} onSave={onSave} />
    </BottomSheet>
  );
}

const parseIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const formatBirthDate = (iso: string) => {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/** Mounted only while the sheet is open, so it always starts from the saved profile. */
function PersonalInfoForm({
  profile,
  onClose,
  onSave,
}: Pick<PersonalInfoSheetProps, "profile" | "onClose" | "onSave">) {
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<"birthDate" | "height" | "weight" | null>(null);

  const today = startOfDay(new Date());
  const youngest = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate());
  const oldest = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

  const handleSave = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = REQUIRED_MESSAGE;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await onSave({ name: name.trim(), email: profile.email, birthDate, heightCm, weightKg });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials(name || profile.name)}</Text>
        </View>
        {/* TODO: pick / take a photo (needs expo-image-picker). */}
        <Pressable accessibilityRole="button" style={styles.changePhoto}>
          <Text style={styles.changePhotoText}>Change photo</Text>
        </Pressable>
      </View>

      <TextField
        label="Full name"
        icon={User}
        value={name}
        onChange={(v) => {
          setName(v);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={errors.name}
        autoCapitalize="words"
      />
      <TextField
        label="Email"
        icon={Envelope}
        value={profile.email}
        onChange={() => {}}
        // The email is the account identity; changing it needs re-verification (not built yet).
        editable={false}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <SelectField
        label="Date of birth"
        icon={Cake}
        value={formatBirthDate(birthDate)}
        active={picker === "birthDate"}
        onPress={() => setPicker("birthDate")}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <SelectField
            label="Height"
            icon={Ruler}
            value={String(heightCm)}
            suffix="cm"
            active={picker === "height"}
            onPress={() => setPicker("height")}
          />
        </View>
        <View style={styles.half}>
          <SelectField
            label="Weight"
            icon={Scales}
            value={String(weightKg)}
            suffix="kg"
            active={picker === "weight"}
            onPress={() => setPicker("weight")}
          />
        </View>
      </View>

      <ButtonPrimary label="Save changes" onPress={handleSave} disabled={saving} />

      {/* Pickers live inside the form so they stack on top of this sheet. */}
      <DatePickerSheet
        visible={picker === "birthDate"}
        title="Date of birth"
        value={parseIso(birthDate)}
        minDate={oldest}
        maxDate={today}
        blockedAfter={youngest}
        blockedMessage={MIN_AGE_MESSAGE}
        onClose={() => setPicker(null)}
        onConfirm={(d) => {
          setBirthDate(toIso(d));
          setPicker(null);
        }}
      />
      <NumberPickerSheet
        visible={picker === "height"}
        title="Height"
        min={100}
        max={250}
        unit="cm"
        value={heightCm}
        onClose={() => setPicker(null)}
        onConfirm={(n) => {
          setHeightCm(n);
          setPicker(null);
        }}
      />
      <NumberPickerSheet
        visible={picker === "weight"}
        title="Weight"
        min={30}
        max={200}
        unit="kg"
        value={weightKg}
        onClose={() => setPicker(null)}
        onConfirm={(n) => {
          setWeightKg(n);
          setPicker(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { alignSelf: "stretch", gap: 16 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontFamily: fonts.bold, fontSize: 19, color: colors.white },
  changePhoto: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  changePhotoText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  row: { flexDirection: "row", gap: 14 },
  half: { flex: 1 },
});
