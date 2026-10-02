import type { LoggingData, SaveLogInput } from "../types";
import { supabaseLoggingApi } from "./supabase-logging-api";

/**
 * What the log sheets need from the backend (Supabase RPCs `app_logs_today` / `app_log_save`).
 * Each save is for one kind and one day; saving the same kind again that day replaces it.
 */
export interface LoggingApi {
  getData(): Promise<LoggingData>;
  save(input: SaveLogInput): Promise<void>;
}

export const loggingApi: LoggingApi = supabaseLoggingApi;
