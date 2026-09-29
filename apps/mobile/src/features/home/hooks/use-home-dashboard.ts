import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { fetchHomeDashboard } from "../services/home-api";
import type { HomeDashboard } from "../types";

/** Loads the dashboard when Home is shown, and again when coming back to it (e.g. after a check-in). */
export function useHomeDashboard() {
  const [data, setData] = useState<HomeDashboard | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchHomeDashboard().then((d) => {
        if (!cancelled) setData(d);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return { data };
}
