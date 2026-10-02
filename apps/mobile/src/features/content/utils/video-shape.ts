import type { VideoItem } from "../types";

/** Width / height of a video: the detected ratio, else 9:16 or 16:9 from its orientation. Kept to a sane range. */
export function videoRatio(video: Pick<VideoItem, "orientation" | "aspectRatio">): number {
  const ratio = video.aspectRatio ?? (video.orientation === "portrait" ? 9 / 16 : 16 / 9);
  return Math.min(2.4, Math.max(0.4, ratio));
}

export const isPortrait = (video: Pick<VideoItem, "orientation" | "aspectRatio">) => videoRatio(video) < 1;
