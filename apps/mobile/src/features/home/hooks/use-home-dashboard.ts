import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLogging } from "@/features/logging/context/logging-context";
import { fetchHomeDashboard } from "../services/home-api";
import type { HomeDashboard } from "../types";

/**
 * Loads the dashboard when Home is shown, when coming back to it (e.g. after a check-in), and
 * after the user logs something here (it changes the cycle card, check marks, notes and tips).
 */
export function useHomeDashboard() {
  const [data, setData] = useState<HomeDashboard | null>(null);
  const { version } = useLogging();

  /** Fetches once; the returned function ignores the result if it arrives after cleanup. */
  const load = useCallback(() => {
    let cancelled = false;
    fetchHomeDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        // Keep showing the last dashboard we have.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(load);

  // Reload on each save, but not on mount (the focus effect already did).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    return load();
  }, [version, load]);

  return { data };
}
