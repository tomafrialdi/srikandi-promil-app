import { toIsoDate } from "@/features/calendar/utils/dates";
import { recordContentEvent } from "@/features/content/api/content-api";
import { ikUrl } from "@/lib/imagekit";
import { supabase } from "@/lib/supabase";
import type { ArticleCategory, ArticleDetail, ArticleSummary } from "../types";
import { markdownToBlocks } from "../utils/markdown";
import type { ArticlesApi } from "./articles-api";

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

/** Article pictures are loaded through the image proxy at a size that fits the screen. */
const withImage = (a: ArticleSummary): ArticleSummary => ({ ...a, imageUrl: ikUrl(a.imageUrl, { w: 800 }) ?? "" });

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
      featured: showFeatured && row.articles[0] ? withImage(row.articles[0]) : null,
      articles: (showFeatured ? row.articles.slice(1) : row.articles).map(withImage),
    };
  },

  async getDetail(id): Promise<ArticleDetail> {
    const { markdown, ...rest } = await call<DetailRow>("app_article_get", { p_id: id });
    recordContentEvent(id, "read");
    const body = markdownToBlocks(markdown).map((block) =>
      block.type === "image" ? { ...block, url: ikUrl(block.url, { w: 1000 }) ?? block.url } : block,
    );
    return { ...withImage(rest), publishedAt: rest.publishedAt, bookmarked: rest.bookmarked, related: rest.related.map(withImage), body };
  },

  async setBookmarked(id, bookmarked) {
    await call("app_content_set_bookmark", { p_id: id, p_on: bookmarked });
  },
};
