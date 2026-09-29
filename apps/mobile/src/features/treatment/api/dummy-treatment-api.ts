import { delay } from "@/utils/http";
import type { TreatmentData } from "../types";
import type { TreatmentApi } from "./treatment-api";

/** An ISO date-time `days` from now at the given time, so the appointment is always upcoming. */
function inDays(days: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

let data: TreatmentData = {
  program: {
    title: "IUI · Cycle 1",
    subtitle: "Letrozole protocol · dr. Sarah Lestari",
    dayLabel: "Day 5",
    stages: [
      { id: "stimulation", label: "Stimulation" },
      { id: "trigger", label: "Trigger" },
      { id: "iui", label: "IUI" },
      { id: "wait", label: "2-week wait" },
    ],
    currentStageIndex: 0,
  },
  schedule: [
    { id: "letrozole", title: "Letrozole 5 mg", description: "08:00 · after breakfast", kind: "medication", done: true },
    { id: "folic", title: "Folic acid 400 mcg", description: "08:00", kind: "medication", done: true },
    { id: "ovidrel", title: "Ovidrel trigger shot", description: "Sat 24 May · 21:00 sharp", kind: "event", tag: "Reminder on" },
  ],
  appointment: {
    startsAt: inDays(2, 9, 30),
    title: "Follicle ultrasound",
    place: "Bunda Women's Clinic",
  },
  labs: [
    { id: "amh", label: "AMH", value: "2.4 ng/mL", status: { label: "Normal", tone: "success" } },
    { id: "fsh", label: "FSH (day 3)", value: "7.1 mIU/mL", status: { label: "Normal", tone: "success" } },
    { id: "follicle", label: "Lead follicle", value: "17 mm", status: { label: "Growing", tone: "success" } },
    { id: "endometrium", label: "Endometrium", value: "8.2 mm", status: { label: "Good", tone: "success" } },
  ],
};

/** Short text for the Settings row while there is no backend, e.g. "IUI · Day 5". */
export const dummyTreatmentLabel = () => `${data.program.title.split(" · ")[0]} · ${data.program.dayLabel}`;

export const dummyTreatmentApi: TreatmentApi = {
  async get() {
    await delay(150);
    return data;
  },
  async setScheduleDone(itemId, done) {
    await delay(80);
    data = { ...data, schedule: data.schedule.map((s) => (s.id === itemId ? { ...s, done } : s)) };
  },
};
