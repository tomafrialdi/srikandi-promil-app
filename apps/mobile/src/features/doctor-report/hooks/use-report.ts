import { useEffect, useState } from "react";

import { reportApi } from "../api/report-api";
import type { ReportData, ReportRange, ReportSection } from "../types";

/** Preview for the chosen range + the "include" switches (initialised from the first response). */
export function useReport() {
  const [range, setRange] = useState<ReportRange>("last-6");
  const [data, setData] = useState<ReportData | null>(null);
  const [include, setInclude] = useState<ReportData["include"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    reportApi
      .get(range)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        // Keep what the user already switched; only the first load sets the defaults.
        setInclude((cur) => cur ?? d.include);
      })
      .catch(() => {
        // Keep showing the previous preview; the next range change retries.
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const toggle = (section: ReportSection, value: boolean) =>
    setInclude((cur) => (cur ? { ...cur, [section]: value } : cur));

  return { range, setRange, preview: data?.preview ?? null, include, toggle };
}
