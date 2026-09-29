import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loggingApi } from "../api/logging-api";
import type { LogKind, LoggingData, SaveLogInput, TrackerKind } from "../types";

interface LoggingContextValue {
  /** Null until the first load finishes. */
  data: LoggingData | null;
  /** Sheet currently shown, or null when closed. */
  active: LogKind | null;
  /** Trackers logged today. */
  logged: TrackerKind[];
  /** Opens a sheet from anywhere in the app. */
  openLog: (kind: LogKind) => void;
  /** Opens a tracker from the "Log today" hub; after saving, the hub is shown again. */
  openFromHub: (kind: TrackerKind) => void;
  closeLog: () => void;
  /** Saves a log, marks it as done, then returns to the hub or closes. */
  save: (input: SaveLogInput) => Promise<void>;
}

const LoggingContext = createContext<LoggingContextValue | null>(null);

/** Owns the log sheets' data and which sheet is open. Render `<LogSheetHost />` inside it. */
export function LoggingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LoggingData | null>(null);
  const [logged, setLogged] = useState<TrackerKind[]>([]);
  const [active, setActive] = useState<LogKind | null>(null);
  const [returnTo, setReturnTo] = useState<LogKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    loggingApi.getData().then((d) => {
      if (cancelled) return;
      setData(d);
      setLogged(d.overview.loggedKinds);
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
      await loggingApi.save(input);
      const { kind } = input;
      if (kind !== "supplement") setLogged((cur) => (cur.includes(kind) ? cur : [...cur, kind]));
      if (returnTo) {
        setActive(returnTo);
        setReturnTo(null);
      } else {
        setActive(null);
      }
    },
    [returnTo],
  );

  const value = useMemo(
    () => ({ data, active, logged, openLog, openFromHub, closeLog, save }),
    [data, active, logged, openLog, openFromHub, closeLog, save],
  );

  return <LoggingContext.Provider value={value}>{children}</LoggingContext.Provider>;
}

export function useLogging(): LoggingContextValue {
  const ctx = useContext(LoggingContext);
  if (!ctx) throw new Error("useLogging must be used inside <LoggingProvider>");
  return ctx;
}
