import type { PartnerData } from "../types";

/** Static education copy shown on the Partner screen (not user data). */
export const MALE_INSIGHT: PartnerData["maleInsight"] = {
  stat: "40–50%",
  text: "of fertility challenges involve a male factor. It's a team effort.",
};

export const PARTNER_TIPS: PartnerData["tips"] = [
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
];
