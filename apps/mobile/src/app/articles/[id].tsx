import { useLocalSearchParams } from "expo-router";

import { ArticleDetailScreen } from "@/features/articles/components/article-detail-screen";

export default function ArticleDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ArticleDetailScreen id={id} />;
}
