import type { ArticleDetail, ArticleListResponse, ArticleQuery } from "../types";
import { supabaseArticlesApi } from "./supabase-articles-api";

/**
 * What the article screens need from the backend: the Content library's published articles that
 * fit the signed-in user (Supabase RPCs `app_articles_list`, `app_article_get`,
 * `app_content_set_bookmark`).
 */
export interface ArticlesApi {
  list(query?: ArticleQuery): Promise<ArticleListResponse>;
  getDetail(id: string): Promise<ArticleDetail>;
  setBookmarked(id: string, bookmarked: boolean): Promise<void>;
}

export const articlesApi: ArticlesApi = supabaseArticlesApi;
