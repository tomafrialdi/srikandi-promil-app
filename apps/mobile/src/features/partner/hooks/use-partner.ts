import { useCallback, useEffect, useState } from "react";

import { partnerApi } from "../api/partner-api";
import type { PartnerData, ShareKey } from "../types";

/** Loads the partner screen; sharing toggles are optimistic (rolled back if the request fails). */
export function usePartner() {
  const [data, setData] = useState<PartnerData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    partnerApi
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

  /** Saves the partner's name (add or rename), then shows what the server stored. */
  const save = useCallback(async (name: string) => {
    await partnerApi.save(name);
    setData(await partnerApi.get());
  }, []);

  const remove = useCallback(async () => {
    await partnerApi.remove();
    setData(await partnerApi.get());
  }, []);

  const setSharing = useCallback(async (key: ShareKey, enabled: boolean) => {
    const apply = (value: boolean) =>
      setData((cur) => (cur ? { ...cur, sharing: { ...cur.sharing, [key]: value } } : cur));
    apply(enabled);
    try {
      await partnerApi.setSharing(key, enabled);
    } catch {
      apply(!enabled);
    }
  }, []);

  return { data, error, save, remove, setSharing };
}
