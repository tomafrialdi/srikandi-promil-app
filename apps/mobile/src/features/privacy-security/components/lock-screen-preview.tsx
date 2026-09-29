import { CalendarBlank, Check, Flower } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

interface LockScreenPreviewProps {
  before: string;
  after: string;
  /** "after" = sensitive words hidden. The active card gets the pink outline and a check. */
  active: "before" | "after";
}

/** Shows what a notification looks like on the lock screen with discreet mode off vs. on. */
export function LockScreenPreview({ before, after, active }: LockScreenPreviewProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Preview on lock screen</Text>

      <View style={[styles.card, active === "before" && styles.cardActive]}>
        <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
          <Flower size={15} color={colors.white} />
        </View>
        <Text style={[styles.message, active === "before" && styles.messageActive]}>{before}</Text>
        {active === "before" ? <Check size={16} weight="bold" color={colors.primary} /> : null}
      </View>

      <View style={[styles.card, active === "after" && styles.cardActive]}>
        <View style={[styles.appIcon, { backgroundColor: colors.info }]}>
          <CalendarBlank size={15} color={colors.white} />
        </View>
        <Text style={[styles.message, active === "after" && styles.messageActive]}>{after}</Text>
        {active === "after" ? <Check size={16} weight="bold" color={colors.primary} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontFamily: fonts.bold, fontSize: 11, color: colors.inkFaint },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: colors.surfaceAlt,
  },
  cardActive: { borderColor: colors.primary, backgroundColor: colors.card },
  appIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  message: { flex: 1, fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
  messageActive: { color: colors.ink },
});
