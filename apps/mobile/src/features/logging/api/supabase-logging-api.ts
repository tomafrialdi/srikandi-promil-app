import { toIsoDate } from "@/features/calendar/utils/dates";
import { supabase } from "@/lib/supabase";
import catalog from "../data/logging-data.json";
import type { IntimacyDay, LoggingData, SaveLogInput } from "../types";
import type { LoggingApi } from "./logging-api";

interface TodayRow {
  loggedKinds: LoggingData["overview"]["loggedKinds"];
  mood: { moodId: string; note: string | null } | null;
  symptomIds: string[];
  temperature: { celsius: number; timeOfDay: string } | null;
  intimacyDays: { date: string; had: boolean }[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function saveLog(
  kind: string,
  date: string,
  fields: { value?: string; number?: number; payload?: Record<string, unknown> } = {},
) {
  const { error } = await supabase.rpc("app_log_save", {
    p_kind: kind,
    p_date: date,
    p_value: fields.value ?? null,
    p_number: fields.number ?? null,
    p_payload: fields.payload ?? {},
  });
  if (error) throw new Error(error.message);
}

/** The week strip under "Intimacy": logged days, today, and the rest. */
function intimacyDays(rows: TodayRow["intimacyDays"], today: string): IntimacyDay[] {
  return rows.map((row) => {
    const [y, m, d] = row.date.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const status: IntimacyDay["status"] = row.had ? "logged" : row.date === today ? "today" : "none";
    return { weekday: WEEKDAYS[date.getDay()], date: d, status };
  });
}

/**
 * Options and copy are static (data/logging-data.json); what the user logged comes from Supabase
 * (`app_logs_today`). Medications and supplements aren't stored server-side yet.
 */
export const supabaseLoggingApi: LoggingApi = {
  async getData(): Promise<LoggingData> {
    const base = catalog as LoggingData;
    const today = toIsoDate(new Date());
    const { data, error } = await supabase.rpc("app_logs_today", { p_today: today });
    if (error) throw new Error(error.message);
    const row = data as TodayRow;

    return {
      ...base,
      overview: {
        ...base.overview,
        loggedKinds: row.loggedKinds,
        // The sample copy claims a conception chance; there is no prediction behind it yet.
        summary: { ...base.overview.summary, title: "Your signs today" },
      },
      today: {
        mood: row.mood ? { moodId: row.mood.moodId, note: row.mood.note ?? undefined } : null,
        symptomIds: row.symptomIds,
        temperature: row.temperature,
      },
      // No AI reading of LH photos and no DPO calculation yet.
      lhTest: { ...base.lhTest, reading: null },
      pregnancyTest: { ...base.pregnancyTest, warning: null },
      intimacy: {
        ...base.intimacy,
        days: intimacyDays(row.intimacyDays, today),
        score: { done: row.intimacyDays.filter((d) => d.had).length, total: row.intimacyDays.length },
        insight: "Every 1–2 days during the fertile window is ideal — no need for daily pressure.",
      },
    };
  },

  async save(input: SaveLogInput) {
    const today = toIsoDate(new Date());

    switch (input.kind) {
      case "temperature":
        return saveLog("temperature", today, { value: input.timeOfDay, number: input.celsius });
      case "mood":
        return saveLog("mood", today, { value: input.moodId, payload: input.note ? { note: input.note } : {} });
      case "symptom":
        return saveLog("symptom", today, { payload: { symptoms: input.symptomIds } });
      case "cervical-fluid":
        return saveLog("cervical_fluid", today, { value: input.fluidId });
      case "lh-test":
        return saveLog("lh_test", today, { value: input.resultId });
      case "intimacy":
        return saveLog("intimacy", today, { value: input.hadIntimacy ? "yes" : "no" });
      case "pregnancy-test":
        return saveLog("pregnancy_test", today, { value: input.resultId, payload: { testType: input.testTypeId } });
      case "note": {
        // "New note" is several signs at once; each goes to its own log for that day.
        if (input.moodId) await saveLog("mood", input.date, { value: input.moodId });
        if (input.symptomIds && input.symptomIds.length > 0) {
          await saveLog("symptom", input.date, { payload: { symptoms: input.symptomIds } });
        }
        if (input.celsius !== undefined) {
          await saveLog("temperature", input.date, { value: "morning", number: input.celsius });
        }
        if (input.flowId) await saveLog("flow", input.date, { value: input.flowId });
        if (input.text?.trim()) await saveLog("note", input.date, { payload: { text: input.text } });
        return;
      }
      // TODO(backend): medications and supplements aren't stored yet (nothing is sent).
      case "medications":
      case "supplement":
        return;
    }
  },
};
