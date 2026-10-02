export interface ArticleCategory {
  id: string;
  label: string;
}

/** One article in a list (featured card, rows, related). */
export interface ArticleSummary {
  id: string;
  category: ArticleCategory;
  title: string;
  excerpt: string;
  readMinutes: number;
  /** Display name, e.g. "Dr. Amelia Wong". */
  author: string;
  imageUrl: string;
}

/** Body of an article as ordered blocks, so the backend can send structured content. */
export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "quote"; text: string }
  /** A button that opens an app link, e.g. `srikandi://log/lh`. */
  | { type: "cta"; label: string; link: string }
  /** A picture inside the article body (`![alt](url)` in the console editor). */
  | { type: "image"; url: string; alt: string };

export interface ArticleDetail extends Omit<ArticleSummary, "excerpt"> {
  /** ISO date, e.g. "2026-05-18". */
  publishedAt: string;
  bookmarked: boolean;
  body: ArticleBlock[];
  related: ArticleSummary[];
}

export interface ArticleListResponse {
  /** Filter chips after "All". */
  categories: ArticleCategory[];
  /** Big card on top; the server sends null when filtering or searching. */
  featured: ArticleSummary | null;
  articles: ArticleSummary[];
}

export interface ArticleQuery {
  query?: string;
  /** Category id, or "all". */
  category?: string;
}
