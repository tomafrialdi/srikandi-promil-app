import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const AVATAR_SIZE = 512;

export type AvatarSource = "camera" | "library";

export class PermissionDeniedError extends Error {
  constructor(source: AvatarSource) {
    super(
      source === "camera"
        ? "Camera access is turned off. Enable it in your phone's Settings."
        : "Photo access is turned off. Enable it in your phone's Settings.",
    );
    this.name = "PermissionDeniedError";
  }
}

/**
 * Lets the user take/choose a square-cropped photo and returns it resized to 512 px JPEG
 * (small, fast upload). Returns null when they cancel.
 */
export async function pickAvatar(source: AvatarSource): Promise<{ uri: string; mimeType: string } | null> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PermissionDeniedError(source);

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: "images",
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;

  const context = ImageManipulator.manipulate(result.assets[0].uri).resize({ width: AVATAR_SIZE });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: saved.uri, mimeType: "image/jpeg" };
}
