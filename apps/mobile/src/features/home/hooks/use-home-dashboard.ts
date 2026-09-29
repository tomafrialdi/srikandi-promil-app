import { useEffect, useState } from "react";

import { fetchHomeDashboard } from "../services/home-api";
import type { HomeDashboard } from "../types";

/** Loads the dashboard once. `data` is null until it arrives. */
export function useHomeDashboard() {
  const [data, setData] = useState<HomeDashboard | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHomeDashboard().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data };
}
