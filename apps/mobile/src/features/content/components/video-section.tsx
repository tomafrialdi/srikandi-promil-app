import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Play } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius } from "@/constants/theme";
import { canPlayInApp, ikUrl } from "@/lib/imagekit";
import { fetchVideos, recordContentEvent } from "../api/content-api";
import type { VideoItem, VideoPlacement } from "../types";
import { isPortrait, videoRatio } from "../utils/video-shape";
import { VideoPlayerSheet } from "./video-player-sheet";

const formatDuration = (seconds: number | null) =>
  seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : null;

/** Videos from the Content library for one place in the app. Renders nothing when there are none. */
export function VideoSection({
  placement,
  title = "Videos",
  inset = 0,
}: {
  placement: VideoPlacement;
  title?: string;
  /** Side padding for a section placed full-width: the cards scroll edge to edge, starting inset. */
  inset?: number;
}) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  // `selected` stays after closing so the sheet keeps its content while it slides down.
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchVideos(placement)
      .then((list) => {
        if (!cancelled) setVideos(list);
      })
      .catch(() => {
        // Optional content: nothing to show.
      });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (videos.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={{ paddingHorizontal: inset }}>
        <SectionHeader title={title} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onPlay={() => {
              recordContentEvent(video.id, "click");
              // Our own mp4s play right here in a bottom sheet; other links (e.g. YouTube) open in the browser.
              if (canPlayInApp(video.videoUrl)) {
                setSelected(video);
                setOpen(true);
              } else {
                WebBrowser.openBrowserAsync(video.videoUrl);
              }
            }}
          />
        ))}
      </ScrollView>
      <VideoPlayerSheet video={selected} visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

function VideoCard({ video, onPlay }: { video: VideoItem; onPlay: () => void }) {
  const portrait = isPortrait(video);
  const thumb = ikUrl(video.thumbnailUrl, { w: portrait ? 360 : 560 });
  const duration = formatDuration(video.durationSeconds);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.title}`}
      onPress={onPlay}
      style={[styles.card, portrait && styles.cardPortrait]}
    >
      <View style={[styles.thumb, { aspectRatio: videoRatio(video) }]}>
        {thumb ? <Image source={{ uri: thumb }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
        <View style={styles.play}>
          <Play size={16} weight="fill" color={colors.white} />
        </View>
        {duration ? (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>
      {video.presenter ? <Text style={styles.presenter}>{video.presenter}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  row: { gap: 12, alignItems: "flex-start" },
  card: { width: 220, gap: 6 },
  // Vertical videos get a narrower, taller card so they keep their shape.
  cardPortrait: { width: 140 },
  thumb: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  play: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  duration: {
    position: "absolute",
    right: 8,
    bottom: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  durationText: { fontFamily: fonts.bold, fontSize: 10, color: colors.white },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  presenter: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
});
