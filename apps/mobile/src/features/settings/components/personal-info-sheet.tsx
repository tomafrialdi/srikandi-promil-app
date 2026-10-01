import { Cake, Envelope, Ruler, Scales, User } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonPrimary } from "@/components/button-primary";
import { DatePickerSheet } from "@/components/date-picker-sheet";
import { REQUIRED_MESSAGE } from "@/components/form/field-shell";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { NumberPickerSheet } from "@/components/number-picker-sheet";
import { colors, fonts, radius } from "@/constants/theme";
import { MONTH_NAMES, startOfDay } from "@/utils/calendar";
import { uploadImage, ikUrl } from "@/lib/imagekit";
import { pickAvatar, type AvatarSource } from "@/features/profile/utils/pick-avatar";
import type { Profile } from "../types";

const MIN_AGE = 18;
const MIN_AGE_MESSAGE = "You need to be at least 18 years old to use Srikandi Promil.";

interface PersonalInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (profile: Profile) => Promise<void>;
  /** Saves the new photo URL right away (null removes the photo). */
  onChangeAvatar: (url: string | null) => Promise<void>;
}

/** Bottom sheet to edit name, birth date, height and weight (email is shown read-only). */
export function PersonalInfoSheet({
  visible,
  onClose,
  profile,
  onSave,
  onChangeAvatar,
}: PersonalInfoSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Personal information" gap={18} scrollable>
      <PersonalInfoForm
        profile={profile}
        onClose={onClose}
        onSave={onSave}
        onChangeAvatar={onChangeAvatar}
      />
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
  onChangeAvatar,
}: Pick<PersonalInfoSheetProps, "profile" | "onClose" | "onSave" | "onChangeAvatar">) {
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

  const [uploading, setUploading] = useState(false);

  const changeAvatar = async (source: AvatarSource) => {
    setUploading(true);
    try {
      const photo = await pickAvatar(source);
      if (!photo) return;
      const url = await uploadImage(photo, "/avatars");
      await onChangeAvatar(url);
    } catch (e) {
      Alert.alert("Couldn't update photo", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      await onChangeAvatar(null);
    } catch {
      Alert.alert("Couldn't remove photo", "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert("Profile photo", undefined, [
      { text: "Take photo", onPress: () => changeAvatar("camera") },
      { text: "Choose from library", onPress: () => changeAvatar("library") },
      ...(profile.avatarUrl
        ? [{ text: "Remove photo", style: "destructive" as const, onPress: removeAvatar }]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const handleSave = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = REQUIRED_MESSAGE;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: profile.email,
        birthDate,
        heightCm,
        weightKg,
        avatarUrl: profile.avatarUrl,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.avatarRow}>
        <View>
          <Avatar
            name={name || profile.name}
            imageUrl={ikUrl(profile.avatarUrl, { w: 160, h: 160 })}
            size={60}
          />
          {uploading ? (
            <View style={styles.uploading}>
              <ActivityIndicator color={colors.white} />
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={uploading}
          onPress={handleChangePhoto}
          style={styles.changePhoto}
        >
          <Text style={styles.changePhotoText}>{uploading ? "Uploading…" : "Change photo"}</Text>
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
  uploading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
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
