import type { Icon } from "phosphor-react-native";
import { View } from "react-native";

import { colors, radius, tones, type Tone } from "@/constants/theme";

interface IconCircleProps {
  icon: Icon;
  tone?: Tone;
  /** Circle diameter. Default 36. */
  size?: number;
  /** Fills the circle with the tone's strong color and draws the icon in white. */
  solid?: boolean;
}

/** Round tinted icon holder used at the start of list rows. */
export function IconCircle({ icon: CircleIcon, tone = "neutral", size = 36, solid }: IconCircleProps) {
  const { bg, fg } = tones[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: solid ? fg : bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircleIcon size={Math.round(size * 0.45)} color={solid ? colors.white : fg} />
    </View>
  );
}
