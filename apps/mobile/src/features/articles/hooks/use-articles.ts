import { useCallback, useEffect, useState } from "react";

import { articlesApi } from "../api/articles-api";
import type { ArticleDetail, ArticleListResponse } from "../types";

const SEARCH_DEBOUNCE_MS = 250;

/** Search text + category chip -> list response (the API does the filtering). */
export function useArticles() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [response, setResponse] = useState<ArticleListResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      articlesApi
        .list({ query, category })
        .then((r) => {
          if (!cancelled) setResponse(r);
        })
        .catch(() => {
          // Keep the previous list on screen; the next search retries.
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, category]);

  return { query, setQuery, category, setCategory, response };
}

/** One article + optimistic bookmark toggle. `error` is true when it can't be found. */
export function useArticleDetail(id: string) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    articlesApi
      .getDetail(id)
      .then((a) => {
        if (!cancelled) setArticle(a);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleBookmark = useCallback(async () => {
    if (!article) return;
    const next = !article.bookmarked;
    setArticle({ ...article, bookmarked: next });
    try {
      await articlesApi.setBookmarked(article.id, next);
    } catch {
      setArticle((cur) => (cur ? { ...cur, bookmarked: !next } : cur));
    }
  }, [article]);

  return { article, error, toggleBookmark };
}
