import { Check, Info, Sparkle } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts, radius, tones } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import { TRACKER_TILES, type TrackerKey } from "../../log-kinds";
import type { LoggingData } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const COLUMNS = 4;

/** The "Log today" hub: fertility summary + a tile per tracker, with a check on the ones done. */
export function LogTodaySheet({ overview }: { overview: LoggingData["overview"] }) {
  const { logged, openFromHub, closeLog } = useLogging();

  const description = overview.summary.description
    .replace("{count}", String(logged.length))
    .replace("{total}", String(TRACKER_TILES.length));

  const rows: (typeof TRACKER_TILES)[] = [];
  for (let i = 0; i < TRACKER_TILES.length; i += COLUMNS) rows.push(TRACKER_TILES.slice(i, i + COLUMNS));

  const handleTilePress = (key: TrackerKey) => {
    if (key === "pregnancy-test") {
      // TODO: navigate to the pregnancy test page once it is built.
      closeLog();
      return;
    }
    openFromHub(key);
  };

  return (
    <SheetContent>
      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Sparkle size={16} color={colors.primary} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryTitle}>{overview.summary.title}</Text>
          <Text style={styles.summaryDescription}>{description}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((tile) => {
              const done = tile.key !== "pregnancy-test" && logged.includes(tile.key);
              const tone = tones[tile.tone];
              return (
                <Pressable
                  key={tile.key}
                  accessibilityRole="button"
                  accessibilityLabel={tile.label}
                  onPress={() => handleTilePress(tile.key)}
                  style={[styles.tile, done && styles.tileDone]}
                >
                  <View style={[styles.tileIcon, { backgroundColor: tone.bg }]}>
                    <tile.icon size={18} color={tone.fg} />
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {tile.label}
                  </Text>
                  {done ? (
                    <View style={styles.badge}>
                      <Check size={10} weight="bold" color={colors.white} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.hint}>
        <Info size={13} color={colors.inkFaint} />
        <Text style={styles.hintText}>{overview.hint}</Text>
      </View>

      <ButtonPrimary label={LOG_COPY.logToday.done} onPress={closeLog} />
    </SheetContent>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: { flex: 1, gap: 2 },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  summaryDescription: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  grid: { gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  tile: {
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
  tileDone: { borderColor: colors.success },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { flexDirection: "row", alignItems: "center", gap: 6 },
  hintText: { flex: 1, fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
});
