import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

import { buildMediaUrl, buildVideoUrl, isPlayableVideo } from "./media-url";
import { supabase } from "./supabase";

const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const endpoint = (process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "").replace(/\/$/, "");
const publicKey = process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY ?? "";

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
/** Only the cloud project has the deployed proxy; a local Supabase (http) would need `supabase functions serve`. */
const proxy = supabaseUrl.startsWith("https://") ? `${supabaseUrl}/functions/v1/img` : null;
const videoProxy = supabaseUrl.startsWith("https://") ? `${supabaseUrl}/functions/v1/vid` : null;

interface UploadAuth {
  token: string;
  expire: number;
  signature: string;
}

/** Short-lived signature from the `imagekit-auth-app` Edge Function (the private key never reaches the app). */
async function getUploadAuth(): Promise<UploadAuth> {
  const { data, error } = await supabase.functions.invoke<UploadAuth>("imagekit-auth-app");
  if (error || !data) throw new Error("Upload service is unavailable. Please try again.");
  return data;
}

/** Uploads a local image file straight to ImageKit and returns its public URL. */
export async function uploadImage(file: { uri: string; mimeType: string }, folder: string): Promise<string> {
  if (!endpoint || !publicKey) throw new Error("ImageKit is not configured (EXPO_PUBLIC_IMAGEKIT_*).");
  const auth = await getUploadAuth();

  const ext = file.mimeType.split("/")[1] ?? "jpg";
  const form = new FormData();
  // expo/fetch only accepts File objects from expo-file-system (not the old { uri, name, type }).
  form.append("file", new File(file.uri));
  form.append("fileName", `upload.${ext}`);
  form.append("folder", folder);
  form.append("useUniqueFileName", "true");
  form.append("publicKey", publicKey);
  form.append("token", auth.token);
  form.append("expire", String(auth.expire));
  form.append("signature", auth.signature);

  const response = await fetch(UPLOAD_URL, { method: "POST", body: form });
  const body = (await response.json().catch(() => null)) as { url?: string; message?: string } | null;
  if (!response.ok || !body?.url) throw new Error(body?.message ?? "Image upload failed.");
  return body.url;
}

/**
 * The URL to load a stored ImageKit image from (resized and compressed). On the cloud project it goes
 * through the `img` Edge Function because some ISPs block ik.imagekit.io; against a local Supabase it
 * talks to ImageKit directly. No `f-auto`: it can answer with AVIF, which not every device decodes.
 */
export function ikUrl(url: string | null | undefined, opts: { w?: number; h?: number } = {}): string | null {
  return buildMediaUrl(url, opts, { endpoint, proxy });
}

/** True when the in-app player can stream this video (our ImageKit mp4/mov/webm); other links open in the browser. */
export const canPlayInApp = (url: string | null | undefined): boolean => isPlayableVideo(url, endpoint);

/** The URL the player streams from: through the `vid` proxy on the cloud project, direct locally. */
export const videoStreamUrl = (url: string): string => buildVideoUrl(url, { endpoint, proxy: videoProxy });
