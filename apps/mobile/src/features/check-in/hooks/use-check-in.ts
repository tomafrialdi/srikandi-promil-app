import { useEffect, useState } from "react";

import { checkInApi } from "../api/check-in-api";
import type { CheckInData } from "../types";

/** Loads today's check-in data once. `data` is null until it arrives. */
export function useCheckIn() {
  const [data, setData] = useState<CheckInData | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkInApi.getToday().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data };
}
