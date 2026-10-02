import { useEffect, useState } from "react";

import { useLogging } from "@/features/logging/context/logging-context";
import { insightsApi } from "../api/insights-api";
import type { InsightsData } from "../types";

const MONTHS = 6;

/** Loads the insights, and reloads after the user logs something (symptoms and periods feed them). */
export function useInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const { version } = useLogging();

  useEffect(() => {
    let cancelled = false;
    insightsApi
      .get(MONTHS)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        // Keep showing what we have; the next change retries.
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { data };
}
