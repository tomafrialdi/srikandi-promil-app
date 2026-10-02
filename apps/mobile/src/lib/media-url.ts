export interface MediaUrlConfig {
  /** ImageKit URL endpoint, e.g. "https://ik.imagekit.io/cq3bz6rgo" (no trailing slash). */
  endpoint: string;
  /** URL of the `img` Edge Function, or null to talk to ImageKit directly. */
  proxy: string | null;
}

/**
 * Builds the URL an image is loaded from. ImageKit URLs get the transformation (`tr`) and, when a proxy
 * is set, are routed through it: some ISPs block ik.imagekit.io, so the phone can't load it directly.
 * Anything that isn't one of our ImageKit URLs is returned untouched.
 */
export function buildMediaUrl(
  url: string | null | undefined,
  opts: { w?: number; h?: number },
  { endpoint, proxy }: MediaUrlConfig,
): string | null {
  if (!url) return null;
  if (!endpoint || !url.startsWith(`${endpoint}/`)) return url;

  const tr = ["q-80", opts.w ? `w-${opts.w}` : "", opts.h ? `h-${opts.h}` : ""].filter(Boolean).join(",");
  const path = url.slice(endpoint.length + 1).split("?")[0];

  if (proxy) return `${proxy}?p=${encodeURIComponent(path)}&tr=${encodeURIComponent(tr)}`;
  return `${url}${url.includes("?") ? "&" : "?"}tr=${tr}`;
}

/** A video the in-app player can stream: one of our ImageKit files, in a format the native players handle. */
export function isPlayableVideo(url: string | null | undefined, endpoint: string): boolean {
  return !!url && !!endpoint && url.startsWith(`${endpoint}/`) && /\.(mp4|m4v|mov|webm)(\?|$)/i.test(url);
}

/**
 * Where the player loads a video from. With a proxy it goes through the `vid` Edge Function (ISPs that
 * block ik.imagekit.io can't reach ImageKit directly); without one, straight from ImageKit. The file goes
 * in `?p=`, not in the URL path: a path ending in ".mp4" makes the CDN in front of Edge Functions drop
 * the Range header, which breaks the player.
 */
export function buildVideoUrl(url: string, { endpoint, proxy }: { endpoint: string; proxy: string | null }): string {
  if (!proxy || !url.startsWith(`${endpoint}/`)) return url;
  return `${proxy}?p=${encodeURIComponent(url.slice(endpoint.length + 1).split("?")[0])}`;
}
