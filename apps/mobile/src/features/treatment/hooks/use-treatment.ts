import { useCallback, useEffect, useState } from "react";

import { treatmentApi } from "../api/treatment-api";
import type { TreatmentData } from "../types";

/** Loads the treatment; ticking a medication is optimistic (rolled back if the request fails). */
export function useTreatment() {
  const [data, setData] = useState<TreatmentData | null>(null);

  useEffect(() => {
    let cancelled = false;
    treatmentApi.get().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setDone = useCallback(async (itemId: string, done: boolean) => {
    const apply = (value: boolean) =>
      setData((cur) =>
        cur ? { ...cur, schedule: cur.schedule.map((s) => (s.id === itemId ? { ...s, done: value } : s)) } : cur,
      );
    apply(done);
    try {
      await treatmentApi.setScheduleDone(itemId, done);
    } catch {
      apply(!done);
    }
  }, []);

  return { data, setDone };
}
