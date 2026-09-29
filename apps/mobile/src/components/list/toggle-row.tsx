import { StyleSheet, Text, View } from "react-native";

import { Switch } from "@/components/switch";
import { colors, fonts } from "@/constants/theme";

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/** Settings row with a label, an optional description, and a switch. */
export function ToggleRow({ label, description, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  text: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  description: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
});
