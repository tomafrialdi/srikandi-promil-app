import type { ArticleDetail, ArticleListResponse, ArticleQuery } from "../types";
import { USE_DUMMY_ARTICLES } from "./config";
import { dummyArticlesApi } from "./dummy-articles-api";
import { httpArticlesApi } from "./http-articles-api";

/**
 * What the article screens need from the backend.
 *
 *   GET    /articles?q=<text>&category=<id|all> -> ArticleListResponse
 *   GET    /articles/:id                        -> ArticleDetail
 *   PUT    /articles/:id/bookmark               -> 204
 *   DELETE /articles/:id/bookmark               -> 204
 */
export interface ArticlesApi {
  list(query?: ArticleQuery): Promise<ArticleListResponse>;
  getDetail(id: string): Promise<ArticleDetail>;
  setBookmarked(id: string, bookmarked: boolean): Promise<void>;
}

/** The single switch between dummy data and the real backend. */
export const articlesApi: ArticlesApi = USE_DUMMY_ARTICLES ? dummyArticlesApi : httpArticlesApi;
