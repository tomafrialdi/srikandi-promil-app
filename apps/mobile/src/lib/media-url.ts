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
