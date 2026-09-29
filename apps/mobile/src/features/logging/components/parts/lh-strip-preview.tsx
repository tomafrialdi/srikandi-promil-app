import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

/** Small illustration of an LH test strip (handle, result window, test and control lines). */
export function LhStripPreview() {
  return (
    <View style={styles.backdrop}>
      <View style={styles.strip}>
        <View style={styles.handle} />
        <View style={styles.window} />
        <View style={[styles.line, { left: 135 }]} />
        <View style={[styles.line, { left: 170 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  strip: {
    width: 240,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  handle: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 70,
    height: 20,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    backgroundColor: colors.info,
  },
  window: {
    position: "absolute",
    left: 110,
    top: 3,
    width: 90,
    height: 14,
    borderRadius: 2,
    backgroundColor: "#F7F2F4",
  },
  line: { position: "absolute", top: 3, width: 5, height: 14, backgroundColor: colors.primary },
});
