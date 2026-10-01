import { useCallback, useEffect, useState } from "react";

import { treatmentApi } from "../api/treatment-api";
import type { TreatmentData } from "../types";

/**
 * Loads the treatment. Ticking a medication is optimistic (rolled back if the request fails);
 * every other change saves, then reloads so the screen shows exactly what the server stored.
 */
export function useTreatment() {
  const [data, setData] = useState<TreatmentData | null>(null);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await treatmentApi.get());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    treatmentApi
      .get()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Runs a save, then refreshes. Rejects (so a sheet can show the failure) if the save fails. */
  const mutate = useCallback(
    async (action: () => Promise<void>) => {
      await action();
      await reload();
    },
    [reload],
  );

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

  return { data, error, reload, mutate, setDone };
}
