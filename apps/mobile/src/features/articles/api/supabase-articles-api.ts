import { toIsoDate } from "@/features/calendar/utils/dates";
import { recordContentEvent } from "@/features/content/api/content-api";
import { supabase } from "@/lib/supabase";
import type { ArticleCategory, ArticleDetail, ArticleSummary } from "../types";
import { markdownToBlocks } from "../utils/markdown";
import type { ArticlesApi } from "./articles-api";

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

type DetailRow = ArticleSummary & {
  publishedAt: string;
  bookmarked: boolean;
  markdown: string;
  related: ArticleSummary[];
};

export const supabaseArticlesApi: ArticlesApi = {
  async list({ query = "", category = "all" } = {}) {
    const row = await call<{ categories: ArticleCategory[]; articles: ArticleSummary[] }>("app_articles_list", {
      p_today: toIsoDate(new Date()),
      p_query: query.trim() || null,
      p_category: category,
    });
    // The newest article is featured, but only on the unfiltered list.
    const showFeatured = category === "all" && !query.trim();
    return {
      categories: row.categories,
      featured: showFeatured ? (row.articles[0] ?? null) : null,
      articles: showFeatured ? row.articles.slice(1) : row.articles,
    };
  },

  async getDetail(id): Promise<ArticleDetail> {
    const { markdown, ...rest } = await call<DetailRow>("app_article_get", { p_id: id });
    recordContentEvent(id, "read");
    return { ...rest, body: markdownToBlocks(markdown) };
  },

  async setBookmarked(id, bookmarked) {
    await call("app_content_set_bookmark", { p_id: id, p_on: bookmarked });
  },
};
