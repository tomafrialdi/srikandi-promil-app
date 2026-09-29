import { Crosshair, MapPin } from "phosphor-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius } from "@/constants/theme";

const MAP_BG = "#DCE5D6";
const ROAD = "#C9D4C1";

/** Decorative pin positions inside the 353 x 220 card. */
const PIN_SLOTS = [
  { x: 150, y: 80, color: colors.primary },
  { x: 250, y: 130, color: colors.info },
  { x: 60, y: 150, color: colors.primary },
];

/**
 * Placeholder map: roads, pins and the "you are here" dot are drawn, not real.
 * TODO: replace with a real map (react-native-maps / expo-maps) plotting `SpecialistSummary.location`.
 */
export function MapPreview({ pinCount }: { pinCount: number }) {
  return (
    <View style={styles.card}>
      <View style={[styles.road, { top: 60, left: 0, right: 0, height: 14 }]} />
      <View style={[styles.road, { top: 140, left: 0, right: 0, height: 10 }]} />
      <View style={[styles.road, { left: 70, top: 0, bottom: 0, width: 14 }]} />
      <View style={[styles.road, { left: 220, top: 0, bottom: 0, width: 10 }]} />

      {PIN_SLOTS.slice(0, pinCount).map((pin, i) => (
        <View key={i} style={[styles.pin, { left: pin.x, top: pin.y }]}>
          <MapPin size={30} weight="fill" color={pin.color} />
        </View>
      ))}

      <View style={styles.userHalo}>
        <View style={styles.userDot} />
      </View>

      {/* TODO: recenter the map on the user. */}
      <Pressable accessibilityRole="button" accessibilityLabel="My location" style={styles.locate}>
        <Crosshair size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: MAP_BG,
  },
  road: { position: "absolute", backgroundColor: ROAD },
  pin: { position: "absolute", width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  userHalo: {
    position: "absolute",
    left: 180,
    top: 105,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: "#2574C433",
    alignItems: "center",
    justifyContent: "center",
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.info,
    borderWidth: 2,
    borderColor: colors.white,
  },
  locate: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
