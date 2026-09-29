import { Image } from "expo-image";
import { BookmarkSimple, Hospital, ShareNetwork } from "phosphor-react-native";
import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { IconButton } from "@/components/icon-button";
import { colors } from "@/constants/theme";

export const COVER_HEIGHT = 260;

interface DetailCoverProps {
  imageUrl: string | null;
  /** Shared when the user taps the share button. */
  shareMessage: string;
}

/** Photo header with translucent back / share / bookmark buttons on top. */
export function DetailCover({ imageUrl, shareMessage }: DetailCoverProps) {
  const insets = useSafeAreaInsets();
  // TODO(backend): persist bookmarks.
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.cover}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} contentFit="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.placeholder}>
          <Hospital size={56} color={colors.inkFaint} />
        </View>
      )}

      <View style={[styles.nav, { paddingTop: insets.top + 8 }]}>
        <BackButton variant="overlay" />
        <View style={styles.right}>
          <IconButton
            icon={ShareNetwork}
            label="Share"
            variant="overlay"
            onPress={() => Share.share({ message: shareMessage })}
          />
          <IconButton
            icon={BookmarkSimple}
            label={saved ? "Remove bookmark" : "Bookmark"}
            variant="overlay"
            filled={saved}
            onPress={() => setSaved((s) => !s)}
          />
        </View>
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
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  right: { flexDirection: "row", gap: 8 },
});
