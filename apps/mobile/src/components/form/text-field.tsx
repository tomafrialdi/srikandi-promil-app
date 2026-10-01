import { Eye, EyeSlash, type Icon } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { colors, fonts } from "@/constants/theme";
import { FieldShell } from "./field-shell";
import { fieldStyles as styles } from "./field-styles";

interface TextFieldProps
  extends Pick<
    TextInputProps,
    | "placeholder"
    | "keyboardType"
    | "autoCapitalize"
    | "autoComplete"
    | "textContentType"
    | "returnKeyType"
    | "onSubmitEditing"
    | "editable"
  > {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: Icon;
  error?: string;
  /** Hides the text and shows a show/hide toggle. */
  secure?: boolean;
  /** Short unit / hint shown inside the field on the right, e.g. "cm". */
  suffix?: string;
}

/** Labelled single-line text input used across the app (onboarding, auth, ...). */
export function TextField({
  label,
  value,
  onChange,
  icon: LeadingIcon,
  error,
  secure,
  suffix,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <FieldShell label={label} error={error}>
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          error ? styles.boxError : null,
          inputProps.editable === false && localStyles.readOnly,
        ]}
      >
        {LeadingIcon ? <LeadingIcon size={18} color={colors.inkFaint} /> : null}
        <TextInput
          {...inputProps}
          value={value}
          onChangeText={onChange}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={secure && !revealed}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.value}
        />
        {suffix ? <Text style={localStyles.suffix}>{suffix}</Text> : null}
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            hitSlop={8}
            onPress={() => setRevealed((r) => !r)}
          >
            {revealed ? (
              <EyeSlash size={18} color={colors.inkFaint} />
            ) : (
              <Eye size={18} color={colors.inkFaint} />
            )}
          </Pressable>
        ) : null}
      </View>
    </FieldShell>
  );
}

const localStyles = StyleSheet.create({
  readOnly: { opacity: 0.6 },
  suffix: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
});
