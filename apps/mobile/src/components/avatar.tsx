import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { initials } from "@/utils/initials";

interface AvatarProps {
  name: string;
  /** Photo URL. Initials on a pink circle are shown when it is missing. */
  imageUrl?: string | null;
  size?: number;
}

/** Round profile picture; initials are shown when there is no photo or it fails to load. */
export function Avatar({ name, imageUrl, size = 44 }: AvatarProps) {
  const circle = { width: size, height: size, borderRadius: radius.pill };
  // Remember which URL failed, so a new URL gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        contentFit="cover"
        onError={() => setFailedUrl(imageUrl)}
        style={[circle, styles.image]}
      />
    );
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
