import { delay } from "@/utils/http";
import type { PrivacySettings, PrivacyToggleKey } from "../types";
import type { PrivacyApi } from "./privacy-api";

let data: PrivacySettings = {
  trustPoints: [
    "Encrypted & stored on servers in Indonesia",
    "Compliant with UU PDP No. 27/2022",
    "Never sold or shared with advertisers",
  ],
  toggles: {
    biometric: true,
    pinBackup: true,
    lockAfterOneMinute: false,
    disguiseIcon: true,
    hideSensitiveWords: true,
  },
  preview: {
    before: "Fertile window today — best day to try for a baby 💕",
    after: "Daily reminder 🌸 Tap to check in",
  },
};

/** "App lock on" / "App lock off", for the Settings row while there is no backend. */
export const dummyAppLockLabel = () =>
  data.toggles.biometric || data.toggles.pinBackup ? "App lock on" : "App lock off";

export const dummyPrivacyApi: PrivacyApi = {
  async get() {
    await delay(150);
    return data;
  },
  async setToggle(key: PrivacyToggleKey, enabled: boolean) {
    await delay(80);
    data = { ...data, toggles: { ...data.toggles, [key]: enabled } };
  },
  async requestDataExport() {
    await delay(400);
  },
  async deleteAllData() {
    await delay(600);
  },
};
