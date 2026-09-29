import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

/** Row of digit boxes backed by one hidden input (so SMS / email autofill works). */
export function OtpInput({ length = 6, value, onChange, hasError }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const isActive = focused && i === activeIndex;
        return (
          <View key={i} style={[styles.box, isActive && styles.boxActive, hasError && styles.boxError]}>
            {value[i] ? (
              <Text style={styles.digit}>{value[i]}</Text>
            ) : isActive ? (
              <View style={styles.caret} />
            ) : null}
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
        accessibilityLabel="Verification code"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  box: {
    flex: 1,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  boxActive: { borderWidth: 2, borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  digit: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink },
  caret: { width: 2, height: 22, backgroundColor: colors.primary },
  hiddenInput: { position: "absolute", width: "100%", height: "100%", opacity: 0 },
});
