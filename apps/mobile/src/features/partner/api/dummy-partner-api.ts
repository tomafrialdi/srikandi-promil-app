import { delay } from "@/utils/http";
import type { PartnerData, ShareKey } from "../types";
import type { PartnerApi } from "./partner-api";

let data: PartnerData = {
  me: { name: "Amara", initial: "A" },
  partner: { name: "Rizky", initial: "R" },
  status: "Connected since March · trying 8 months",
  preview: { message: "Fertile window is open — best days are today & tomorrow 💙" },
  sharing: {
    fertileWindow: true,
    periodDates: true,
    testResults: true,
    mood: false,
    symptomsNotes: false,
  },
  maleInsight: {
    stat: "40–50%",
    text: "of fertility challenges involve a male factor. It's a team effort.",
  },
  tips: [
    { id: "cool", icon: "cool", title: "Keep it cool", description: "No laptops on lap, limit hot baths & saunas" },
    {
      id: "no-smoking",
      icon: "no-smoking",
      title: "Quit smoking, limit alcohol",
      description: "Sperm quality improves within ~3 months",
    },
    {
      id: "analysis",
      icon: "analysis",
      title: "Consider a semen analysis",
      description: "Simple, affordable test — ask your clinic",
    },
  ],
};

export const dummyPartnerApi: PartnerApi = {
  async get() {
    await delay(150);
    return data;
  },
  async setSharing(key: ShareKey, enabled: boolean) {
    await delay(80);
    data = { ...data, sharing: { ...data.sharing, [key]: enabled } };
  },
  async sendTips() {
    await delay(300);
    console.log("[partner] tips sent");
  },
};
