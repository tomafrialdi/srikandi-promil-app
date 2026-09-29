import dummy from "./dummy-articles.json";
import type { ArticleBlock, ArticleDetail, ArticleSummary } from "../types";
import type { ArticlesApi } from "./articles-api";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const summaries = dummy.articles as ArticleSummary[];
const bookmarked = new Set<string>();

type DummyDetail = Omit<ArticleDetail, "related"> & { relatedIds: string[] };

/** Articles without a hand-written body get a short one built from their excerpt. */
function fallbackBody(article: ArticleSummary): ArticleBlock[] {
  return [
    { type: "paragraph", text: article.excerpt },
    {
      type: "paragraph",
      text: "The full article will appear here once the content service is connected.",
    },
  ];
}

/** Mimics what the server does with `q`, `category`, `featured` and related articles. */
export const dummyArticlesApi: ArticlesApi = {
  async list({ query = "", category = "all" } = {}) {
    await delay(200);
    const q = query.trim().toLowerCase();
    const filtered = summaries.filter((a) => {
      if (category !== "all" && a.category.id !== category) return false;
      if (q && !`${a.title} ${a.excerpt}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const showFeatured = category === "all" && !q;
    return {
      categories: dummy.categories,
      featured: showFeatured ? filtered[0] ?? null : null,
      articles: showFeatured ? filtered.slice(1) : filtered,
    };
  },

  async getDetail(id) {
    await delay(200);
    const summary = summaries.find((a) => a.id === id);
    if (!summary) throw new Error(`Article not found: ${id}`);

    const custom = (dummy.details as Record<string, DummyDetail>)[id];
    const { relatedIds, ...rest } = custom ?? {
      ...summary,
      publishedAt: "2026-05-18",
      bookmarked: false,
      body: fallbackBody(summary),
      relatedIds: summaries.filter((a) => a.id !== id).slice(0, 2).map((a) => a.id),
    };

    return {
      ...rest,
      bookmarked: bookmarked.has(id),
      related: relatedIds.map((rid) => summaries.find((a) => a.id === rid)).filter((a): a is ArticleSummary => !!a),
    };
  },

  async setBookmarked(id, value) {
    await delay(80);
    if (value) bookmarked.add(id);
    else bookmarked.delete(id);
  },
};
