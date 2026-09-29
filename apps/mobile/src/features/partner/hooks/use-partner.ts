import { useCallback, useEffect, useState } from "react";

import { partnerApi } from "../api/partner-api";
import type { PartnerData, ShareKey } from "../types";

/** Loads the partner screen; sharing toggles are optimistic (rolled back if the request fails). */
export function usePartner() {
  const [data, setData] = useState<PartnerData | null>(null);

  useEffect(() => {
    let cancelled = false;
    partnerApi.get().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
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

  return { data, setSharing };
}
