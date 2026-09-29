import { useEffect, useState } from "react";

import { insightsApi } from "../api/insights-api";
import type { InsightsData } from "../types";

const MONTHS = 6;

/** Loads the insights once. `data` is null until it arrives. */
export function useInsights() {
  const [data, setData] = useState<InsightsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    insightsApi.get(MONTHS).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data };
}
