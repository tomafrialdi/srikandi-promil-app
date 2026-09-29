import type { LoggingData, SaveLogInput } from "../types";
import { USE_DUMMY_LOGGING } from "./config";
import { dummyLoggingApi } from "./dummy-logging-api";
import { httpLoggingApi } from "./http-logging-api";

/**
 * What the log sheets need from the backend.
 *
 *   GET  /logs/today  -> LoggingData   (options, today's status, meds, timing ...)
 *   POST /logs        -> 204           body: SaveLogInput (discriminated by `kind`)
 */
export interface LoggingApi {
  getData(): Promise<LoggingData>;
  save(input: SaveLogInput): Promise<void>;
}

/** The single switch between dummy data and the real backend. */
export const loggingApi: LoggingApi = USE_DUMMY_LOGGING ? dummyLoggingApi : httpLoggingApi;
