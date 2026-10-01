import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

import { supabase } from "./supabase";

const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const endpoint = (process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "").replace(/\/$/, "");
const publicKey = process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY ?? "";

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
 * Adds ImageKit transformations to a stored URL (resized, compressed). Other URLs pass through.
 * No `f-auto`: it can answer with AVIF, which the image view may not decode on every device.
 */
export function ikUrl(url: string | null | undefined, opts: { w?: number; h?: number } = {}): string | null {
  if (!url) return null;
  if (!endpoint || !url.startsWith(endpoint)) return url;
  const parts = ["q-80"];
  if (opts.w) parts.push(`w-${opts.w}`);
  if (opts.h) parts.push(`h-${opts.h}`);
  return `${url}${url.includes("?") ? "&" : "?"}tr=${parts.join(",")}`;
}
