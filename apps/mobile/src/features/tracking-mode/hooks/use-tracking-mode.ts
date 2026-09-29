import { useEffect, useState } from "react";

import { trackingModeApi } from "../api/tracking-mode-api";
import type { TrackingModeData } from "../types";

/** Loads the modes once. The screen keeps its own draft selection until Save. */
export function useTrackingMode() {
  const [data, setData] = useState<TrackingModeData | null>(null);

  useEffect(() => {
    let cancelled = false;
    trackingModeApi.get().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data };
}
