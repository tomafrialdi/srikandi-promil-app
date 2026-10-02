import { Check } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, tones } from "@/constants/theme";
import { HOME_ICONS } from "../icons";
import { QUICK_ACTION_TO_KIND } from "@/features/logging/log-kinds";
import type { TrackerKind } from "@/features/logging/types";
import type { HomeDashboard, QuickAction } from "../types";

interface QuickActionsGridProps {
  config: HomeDashboard["quickActions"];
  onActionPress?: (action: QuickAction) => void;
  /** Trackers already logged today; they get a small check. */
  loggedKinds?: TrackerKind[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export function QuickActionsGrid({ config, onActionPress, loggedKinds = [] }: QuickActionsGridProps) {
  return (
    <View style={styles.grid}>
      {chunk(config.items, config.columns).map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((action) => {
            const ActionIcon = HOME_ICONS[action.icon];
            const tone = tones[action.tone];
            const kind = QUICK_ACTION_TO_KIND[action.id];
            const done = !!kind && loggedKinds.includes(kind);
            return (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => onActionPress?.(action)}
                style={styles.card}
              >
                <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
                  <ActionIcon size={18} color={tone.fg} />
                  {done ? (
                    <View style={styles.check}>
                      <Check size={9} weight="bold" color={colors.white} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
          {Array.from({ length: config.columns - row.length }, (_, i) => (
            <View key={`pad-${i}`} style={styles.cardPlaceholder} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 15,
    height: 15,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.card,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: { gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardPlaceholder: { flex: 1 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink },
});
