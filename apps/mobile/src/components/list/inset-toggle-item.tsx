import type { Icon } from "phosphor-react-native";
import { StyleSheet, Text } from "react-native";

import { Switch } from "@/components/switch";
import { colors, fonts } from "@/constants/theme";

interface InsetToggleItemProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: Icon;
}

/** Content of one `InsetList` row: optional icon, label, and a switch. */
export function InsetToggleItem({ label, value, onValueChange, icon: LeadingIcon }: InsetToggleItemProps) {
  return (
    <>
      {LeadingIcon ? <LeadingIcon size={17} color={colors.inkMuted} /> : null}
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} />
    </>
  );
}

const styles = StyleSheet.create({
  label: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
});
