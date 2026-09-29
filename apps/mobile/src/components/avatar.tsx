import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { initials } from "@/utils/initials";

interface AvatarProps {
  name: string;
  /** Photo URL. Initials on a pink circle are shown when it is missing. */
  imageUrl?: string | null;
  size?: number;
}

/** Round profile picture with an initials fallback. */
export function Avatar({ name, imageUrl, size = 44 }: AvatarProps) {
  const circle = { width: size, height: size, borderRadius: radius.pill };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} contentFit="cover" style={[circle, styles.image]} />;
  }
  return (
    <View style={[circle, styles.fallback]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.34) }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceAlt },
  fallback: { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: fonts.bold, color: colors.white },
});
