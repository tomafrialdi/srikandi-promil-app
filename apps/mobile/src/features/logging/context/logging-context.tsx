import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Alert } from "react-native";

import { toIsoDate } from "@/features/calendar/utils/dates";
import { loggingApi } from "../api/logging-api";
import type { LogKind, LoggingData, SaveLogInput, TodayEntries, TrackerKind } from "../types";

interface LoggingContextValue {
  /** Null until the first load finishes. */
  data: LoggingData | null;
  /** Sheet currently shown, or null when closed. */
  active: LogKind | null;
  /** Trackers logged today. */
  logged: TrackerKind[];
  /** Values logged today, shared by every sheet and "New note". */
  entries: TodayEntries;
  /** Opens a sheet from anywhere in the app. */
  openLog: (kind: LogKind) => void;
  /** Opens a tracker from the "Log today" hub; after saving, the hub is shown again. */
  openFromHub: (kind: TrackerKind) => void;
  closeLog: () => void;
  /** Saves a log, marks it as done, then returns to the hub or closes. */
  save: (input: SaveLogInput) => Promise<void>;
  /** Saves a "New note". Signs it contains are synced to today's logs when the note is for today. */
  saveNote: (input: Extract<SaveLogInput, { kind: "note" }>) => Promise<void>;
}

const EMPTY_ENTRIES: TodayEntries = { mood: null, symptomIds: [], temperature: null };

const LoggingContext = createContext<LoggingContextValue | null>(null);

/** Owns the log sheets' data and which sheet is open. Render `<LogSheetHost />` inside it. */
export function LoggingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LoggingData | null>(null);
  const [logged, setLogged] = useState<TrackerKind[]>([]);
  const [entries, setEntries] = useState<TodayEntries>(EMPTY_ENTRIES);
  const [active, setActive] = useState<LogKind | null>(null);
  const [returnTo, setReturnTo] = useState<LogKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    loggingApi.getData().then((d) => {
      if (cancelled) return;
      setData(d);
      setLogged(d.overview.loggedKinds);
      setEntries(d.today);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const openLog = useCallback((kind: LogKind) => {
    setReturnTo(null);
    setActive(kind);
  }, []);

  const openFromHub = useCallback((kind: TrackerKind) => {
    setReturnTo("log-today");
    setActive(kind);
  }, []);

  const closeLog = useCallback(() => {
    setReturnTo(null);
    setActive(null);
  }, []);

  const save = useCallback(
    async (input: SaveLogInput) => {
      try {
        await loggingApi.save(input);
      } catch (e) {
        // Keep the sheet open so nothing the user entered is lost.
        Alert.alert("Couldn't save", e instanceof Error ? e.message : "Please try again.");
        return;
      }
      const { kind } = input;
      if (kind !== "supplement" && kind !== "note") {
        setLogged((cur) => (cur.includes(kind) ? cur : [...cur, kind]));
      }
      setEntries((cur) => {
        if (input.kind === "mood") return { ...cur, mood: { moodId: input.moodId, note: input.note } };
        if (input.kind === "symptom") return { ...cur, symptomIds: input.symptomIds };
        if (input.kind === "temperature") {
          return { ...cur, temperature: { celsius: input.celsius, timeOfDay: input.timeOfDay } };
        }
        return cur;
      });
      if (returnTo) {
        setActive(returnTo);
        setReturnTo(null);
      } else {
        setActive(null);
      }
    },
    [returnTo],
  );

  const saveNote = useCallback(async (input: Extract<SaveLogInput, { kind: "note" }>) => {
    await loggingApi.save(input);
    if (input.date !== toIsoDate(new Date())) return; // Only today's note feeds today's logs.

    const synced: TrackerKind[] = [];
    if (input.moodId) synced.push("mood");
    if (input.symptomIds && input.symptomIds.length > 0) synced.push("symptom");
    if (input.celsius !== undefined) synced.push("temperature");
    setLogged((cur) => [...cur, ...synced.filter((k) => !cur.includes(k))]);
    setEntries((cur) => ({
      mood: input.moodId ? { moodId: input.moodId, note: cur.mood?.note } : cur.mood,
      symptomIds: input.symptomIds && input.symptomIds.length > 0 ? input.symptomIds : cur.symptomIds,
      temperature:
        input.celsius !== undefined
          ? { celsius: input.celsius, timeOfDay: cur.temperature?.timeOfDay ?? "morning" }
          : cur.temperature,
    }));
  }, []);

  const value = useMemo(
    () => ({ data, active, logged, entries, openLog, openFromHub, closeLog, save, saveNote }),
    [data, active, logged, entries, openLog, openFromHub, closeLog, save, saveNote],
  );

  return <LoggingContext.Provider value={value}>{children}</LoggingContext.Provider>;
}

export function useLogging(): LoggingContextValue {
  const ctx = useContext(LoggingContext);
  if (!ctx) throw new Error("useLogging must be used inside <LoggingProvider>");
  return ctx;
}
