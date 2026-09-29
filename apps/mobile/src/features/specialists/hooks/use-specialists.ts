import { useEffect, useState } from "react";

import { specialistsApi } from "../api/specialists-api";
import type { SpecialistDetail, SpecialistFilter, SpecialistSummary } from "../types";

const SEARCH_DEBOUNCE_MS = 250;

/** Search text + filter chip -> matching specialists (the API does the filtering). */
export function useSpecialists() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SpecialistFilter>("all");
  const [results, setResults] = useState<SpecialistSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      specialistsApi.list({ query, filter }).then((list) => {
        if (!cancelled) setResults(list);
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, filter]);

  return { query, setQuery, filter, setFilter, results };
}

/** Loads one clinic page. `error` is true when it can't be found. */
export function useSpecialistDetail(id: string) {
  const [detail, setDetail] = useState<SpecialistDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    specialistsApi
      .getDetail(id)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { detail, error };
}
