import { ArrowRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Link on the right, e.g. "View all". */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Adds a small arrow after the action label. */
  actionArrow?: boolean;
}

/** Title (+ optional subtitle) with an optional action link on the right. */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  actionArrow,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="link"
          onPress={onActionPress}
          hitSlop={8}
          style={styles.action}
        >
          <Text style={[styles.actionLabel, actionArrow && styles.actionLabelBold]}>
            {actionLabel}
          </Text>
          {actionArrow ? <ArrowRight size={14} color={colors.primary} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  action: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  actionLabelBold: { fontFamily: fonts.bold },
});
