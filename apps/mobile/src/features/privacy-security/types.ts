export type PrivacyToggleKey =
  | "biometric"
  | "pinBackup"
  | "lockAfterOneMinute"
  | "disguiseIcon"
  | "hideSensitiveWords";

/** Everything the Privacy & security screen shows. The backend returns this shape. */
export interface PrivacySettings {
  /** Short reassurances shown with checkmarks in the dark card. */
  trustPoints: string[];
  toggles: Record<PrivacyToggleKey, boolean>;
  /** Sample lock-screen notification text, before and after "hide sensitive words". */
  preview: { before: string; after: string };
}
