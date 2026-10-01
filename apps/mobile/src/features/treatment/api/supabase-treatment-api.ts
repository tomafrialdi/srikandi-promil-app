import { supabase } from "@/lib/supabase";
import type { TreatmentData } from "../types";
import type { TreatmentApi } from "./treatment-api";

/** The phone's local date as "YYYY-MM-DD"; the server doesn't know the user's time zone. */
export function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function call(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

export const supabaseTreatmentApi: TreatmentApi = {
  async get() {
    return (await call("app_treatment_get", { p_today: localToday() })) as TreatmentData;
  },
  async startProgram(input) {
    await call("app_treatment_start", {
      p_type: input.type,
      p_protocol: input.protocol,
      p_doctor: input.doctor,
      p_started_on: input.startedOn,
      p_cycle_no: input.cycleNo,
    });
  },
  async endProgram() {
    await call("app_treatment_end");
  },
  async setStage(stageIndex) {
    await call("app_treatment_set_stage", { p_stage: stageIndex });
  },
  async addScheduleItem(input) {
    await call("app_treatment_add_item", {
      p_title: input.title,
      p_description: input.description,
      p_kind: input.kind,
      p_tag: input.tag ?? null,
    });
  },
  async deleteScheduleItem(itemId) {
    await call("app_treatment_delete_item", { p_item: itemId });
  },
  async setScheduleDone(itemId, done) {
    await call("app_treatment_set_done", { p_item: itemId, p_done: done, p_today: localToday() });
  },
  async setAppointment(input) {
    await call("app_treatment_set_appointment", {
      p_starts_at: input.startsAt,
      p_title: input.title,
      p_place: input.place,
    });
  },
  async clearAppointment() {
    await call("app_treatment_clear_appointment");
  },
  async addLab(input) {
    await call("app_treatment_add_lab", {
      p_label: input.label,
      p_value: input.value,
      p_status_label: input.statusLabel,
      p_tone: input.tone,
    });
  },
  async deleteLab(labId) {
    await call("app_treatment_delete_lab", { p_lab: labId });
  },
};
