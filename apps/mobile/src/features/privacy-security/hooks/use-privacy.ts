import { useCallback, useEffect, useState } from "react";

import { privacyApi } from "../api/privacy-api";
import type { PrivacySettings, PrivacyToggleKey } from "../types";

/** Loads the privacy settings; toggles are optimistic (rolled back if the request fails). */
export function usePrivacy() {
  const [data, setData] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    privacyApi.get().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setToggle = useCallback(async (key: PrivacyToggleKey, enabled: boolean) => {
    const apply = (value: boolean) =>
      setData((cur) => (cur ? { ...cur, toggles: { ...cur.toggles, [key]: value } } : cur));
    apply(enabled);
    try {
      await privacyApi.setToggle(key, enabled);
    } catch {
      apply(!enabled);
    }
  }, []);

  return { data, setToggle };
}
