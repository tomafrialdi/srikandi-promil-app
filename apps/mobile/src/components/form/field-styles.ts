import { StyleSheet } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

/** Box + text styles shared by every single-line field (text, number, date). */
export const fieldStyles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  boxFocused: { borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  value: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  placeholder: { color: colors.inkFaint },
});
