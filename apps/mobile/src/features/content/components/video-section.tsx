import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Play } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius } from "@/constants/theme";
import { ikUrl } from "@/lib/imagekit";
import { fetchVideos, recordContentEvent } from "../api/content-api";
import type { VideoItem, VideoPlacement } from "../types";

const formatDuration = (seconds: number | null) =>
  seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : null;

/** Videos from the Content library for one place in the app. Renders nothing when there are none. */
export function VideoSection({ placement, title = "Videos" }: { placement: VideoPlacement; title?: string }) {
  const [videos, setVideos] = useState<VideoItem[]>([]);

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
      <SectionHeader title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </ScrollView>
    </View>
  );
}

function VideoCard({ video }: { video: VideoItem }) {
  const thumb = ikUrl(video.thumbnailUrl, { w: 560 });
  const duration = formatDuration(video.durationSeconds);

  // No in-app player yet: the video opens in the system browser sheet.
  const open = () => {
    recordContentEvent(video.id, "click");
    WebBrowser.openBrowserAsync(video.videoUrl);
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Play ${video.title}`} onPress={open} style={styles.card}>
      <View style={styles.thumb}>
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
  row: { gap: 12 },
  card: { width: 220, gap: 6 },
  thumb: {
    height: 124,
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
