import { Eye, EyeSlash, type Icon } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "@/constants/theme";
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
  > {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: Icon;
  error?: string;
  /** Hides the text and shows a show/hide toggle. */
  secure?: boolean;
}

/** Labelled single-line text input used across the app (onboarding, auth, ...). */
export function TextField({
  label,
  value,
  onChange,
  icon: LeadingIcon,
  error,
  secure,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <FieldShell label={label} error={error}>
      <View style={[styles.box, focused && styles.boxFocused, error ? styles.boxError : null]}>
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
