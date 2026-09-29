import { Linking } from "react-native";

/** Opens the phone dialer. */
export function callPhone(phone: string) {
  return Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
}

/** Opens a WhatsApp chat (number in international format without "+", e.g. 6281234567890). */
export function openWhatsApp(number: string, message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return Linking.openURL(`https://wa.me/${number}${text}`);
}

/** Opens turn-by-turn directions in the default maps app (works on iOS and Android). */
export function openDirections(destination: { lat: number; lng: number }) {
  return Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`,
  );
}
