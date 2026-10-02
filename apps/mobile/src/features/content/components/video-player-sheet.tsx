import { useEvent } from "expo";
import * as WebBrowser from "expo-web-browser";
import { useVideoPlayer, VideoView } from "expo-video";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { colors, fonts, radius } from "@/constants/theme";
import { videoStreamUrl } from "@/lib/imagekit";
import type { VideoItem } from "../types";
import { videoRatio } from "../utils/video-shape";

interface VideoPlayerSheetProps {
  /** The video to play; kept after closing so its content stays during the slide-down. */
  video: VideoItem | null;
  visible: boolean;
  onClose: () => void;
}

/** Side padding of the bottom sheet, and how much of the screen height a video may take (the rest is title and description). */
const SHEET_PADDING = 20;
const MAX_HEIGHT_SHARE = 0.58;

/** A video from the Content library, playing in a bottom sheet. Closing the sheet stops it. */
export function VideoPlayerSheet({ video, visible, onClose }: VideoPlayerSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={video?.title} subtitle={video?.presenter ?? undefined} gap={14} scrollable>
      {video ? <PlayerBody key={video.id} video={video} /> : null}
    </BottomSheet>
  );
}

/** Mounted only while the sheet is open, so the native player is created on open and released on close. */
function PlayerBody({ video }: { video: VideoItem }) {
  const source = useMemo(() => videoStreamUrl(video.videoUrl), [video.videoUrl]);
  const player = useVideoPlayer(source, (p) => {
    p.play();
  });
  const { status, error } = useEvent(player, "statusChange", { status: player.status, error: undefined });
  const failed = status === "error";

  // Fit the video's own shape on screen: a wide video fills the width, a vertical one is as tall as the sheet allows.
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const ratio = videoRatio(video);
  const height = Math.min((screenWidth - SHEET_PADDING * 2) / ratio, screenHeight * MAX_HEIGHT_SHARE);
  const frameSize = { width: height * ratio, height };
  if (failed && __DEV__) console.warn("[video] playback error", source, error?.message);

  return (
    <View style={styles.body}>
      <View style={[styles.frame, frameSize]}>
        <VideoView
          player={player}
          nativeControls
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          style={styles.video}
        />
        {status === "loading" ? (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator color={colors.white} />
          </View>
        ) : null}
        {failed ? (
          <View style={styles.overlay}>
            <Text style={styles.error}>This video couldn&apos;t be played here.</Text>
            {__DEV__ && error?.message ? <Text style={styles.errorDetail}>{error.message}</Text> : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => WebBrowser.openBrowserAsync(video.videoUrl)}
              style={styles.fallback}
            >
              <Text style={styles.fallbackText}>Open in browser</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {video.description ? <Text style={styles.description}>{video.description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { alignSelf: "stretch", gap: 12 },
  frame: { alignSelf: "center", borderRadius: 16, overflow: "hidden", backgroundColor: "#000" },
  video: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white, textAlign: "center", paddingHorizontal: 24 },
  errorDetail: { fontFamily: fonts.medium, fontSize: 10, color: colors.whiteSoft, textAlign: "center", paddingHorizontal: 24 },
  fallback: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  fallbackText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  description: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
});
