import { Image } from "expo-image";
import { BookmarkSimple, Hospital, ShareNetwork } from "phosphor-react-native";
import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { IconButton } from "@/components/icon-button";
import { colors } from "@/constants/theme";

export const COVER_HEIGHT = 260;
/** Height of the pinned bar below the status bar (button 40 + padding 8 + 8). */
export const TOP_BAR_CONTENT_HEIGHT = 56;

/** The clinic photo (or a placeholder). The back / share / save buttons live in `DetailTopBar`. */
export function DetailCover({ imageUrl }: { imageUrl: string | null }) {
  return (
    <View style={styles.cover}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} contentFit="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.placeholder}>
          <Hospital size={56} color={colors.inkFaint} />
        </View>
      )}
    </View>
  );
}

interface DetailTopBarProps {
  /** Shared when the user taps the share button. */
  shareMessage: string;
  /** False while the photo is behind the bar (translucent buttons); true once content scrolled under it. */
  solid: boolean;
}

/**
 * Pinned over the top of the screen. Translucent buttons on the photo, then a solid
 * bar with a hairline once the page has scrolled past the photo.
 */
export function DetailTopBar({ shareMessage, solid }: DetailTopBarProps) {
  const insets = useSafeAreaInsets();
  // TODO(backend): persist bookmarks.
  const [saved, setSaved] = useState(false);
  const variant = solid ? "default" : "overlay";

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }, solid && styles.barSolid]}>
      <BackButton variant={variant} />
      <View style={styles.right}>
        <IconButton
          icon={ShareNetwork}
          label="Share"
          variant={variant}
          onPress={() => Share.share({ message: shareMessage })}
        />
        <IconButton
          icon={BookmarkSimple}
          label={saved ? "Remove bookmark" : "Bookmark"}
          variant={variant}
          filled={saved}
          onPress={() => setSaved((s) => !s)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { height: COVER_HEIGHT, backgroundColor: colors.surfaceAlt },
  placeholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  barSolid: { backgroundColor: colors.surface, borderBottomColor: colors.border },
  right: { flexDirection: "row", gap: 8 },
});
