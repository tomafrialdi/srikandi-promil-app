import { supabaseTreatmentApi } from "./supabase-treatment-api";
import type {
  AppointmentInput,
  LabInput,
  ScheduleInput,
  StartProgramInput,
  TreatmentData,
} from "../types";

/**
 * What the My treatment screen needs from the backend (Supabase RPCs `app_treatment_*`).
 * Everything acts on the signed-in user's own active program.
 */
export interface TreatmentApi {
  get(): Promise<TreatmentData>;
  /** Starts a program; any active one is ended. */
  startProgram(input: StartProgramInput): Promise<void>;
  endProgram(): Promise<void>;
  setStage(stageIndex: number): Promise<void>;
  addScheduleItem(input: ScheduleInput): Promise<void>;
  deleteScheduleItem(itemId: string): Promise<void>;
  /** Ticks a medication for today. */
  setScheduleDone(itemId: string, done: boolean): Promise<void>;
  /** Replaces the upcoming appointment. */
  setAppointment(input: AppointmentInput): Promise<void>;
  clearAppointment(): Promise<void>;
  addLab(input: LabInput): Promise<void>;
  deleteLab(labId: string): Promise<void>;
}

export const treatmentApi: TreatmentApi = supabaseTreatmentApi;
