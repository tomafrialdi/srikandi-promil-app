export const colors = {
  primary: "#C13D68",
  primarySoft: "#F6DEE6",
  surface: "#FAF9F6",
  surfaceAlt: "#F1EFE9",
  card: "#FFFFFF",
  ink: "#1A1A18",
  inkMuted: "#6F6D66",
  inkFaint: "#A6A49B",
  border: "#E7E4DC",
  success: "#3F9950",
  successSoft: "#E1F1E3",
  info: "#2574C4",
  infoSoft: "#DCEAF9",
  warning: "#E0A030",
  warningSoft: "#FBEFD9",
  warningInk: "#9A6A12",
  error: "#D64545",
  errorSoft: "#FAE1E1",
  overlay: "#14140F8A",
  shadow: "#1A1A18",
  white: "#FFFFFF",
  whiteSoft: "#FFFFFFCC",
  whiteGlass: "#FFFFFF26",
} as const;

export const fonts = {
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

export const radius = {
  sm: 12,
  md: 14,
  lg: 24,
  pill: 100,
} as const;

/** Soft background + strong foreground pairs for icon wraps, chips and badges. */
export const tones = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  info: { bg: colors.infoSoft, fg: colors.info },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  success: { bg: colors.successSoft, fg: colors.success },
  error: { bg: colors.errorSoft, fg: colors.error },
} as const;

export type Tone = keyof typeof tones;
