import { MagnifyingGlass } from "phosphor-react-native";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { colors } from "@/constants/theme";
import { fieldStyles as styles } from "./field-styles";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Search box: magnifier + input, no label. */
export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.box, { paddingVertical: 13 }, focused && styles.boxFocused]}>
      <MagnifyingGlass size={18} color={colors.inkFaint} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        returnKeyType="search"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.value, { fontSize: 13 }]}
      />
    </View>
  );
}
