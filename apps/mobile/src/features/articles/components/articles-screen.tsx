import { router } from "expo-router";
import { BookmarkSimple } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/back-button";
import { FilterChips } from "@/components/filter-chips";
import { SearchField } from "@/components/form/search-field";
import { IconButton } from "@/components/icon-button";
import { StickyBleed, StickyScreen } from "@/components/sticky-screen";
import { colors, fonts } from "@/constants/theme";
import { useArticles } from "../hooks/use-articles";
import { ArticleRow } from "./article-row";
import { FeaturedArticleCard } from "./featured-article-card";

function openArticle(id: string) {
  router.push({ pathname: "/articles/[id]", params: { id } });
}

export function ArticlesScreen() {
  const { query, setQuery, category, setCategory, response } = useArticles();

  const filters = [{ id: "all", label: "All" }, ...(response?.categories ?? [])];
  const isEmpty = response && !response.featured && response.articles.length === 0;

  return (
    <StickyScreen
      contentStyle={styles.content}
      header={
        <>
          <View style={styles.headRow}>
            <BackButton />
            <Text style={styles.title}>Articles</Text>
            {/* TODO: open the saved articles screen. */}
            <IconButton icon={BookmarkSimple} label="Saved articles" />
          </View>

          <SearchField value={query} onChange={setQuery} placeholder="Search articles" />

          <StickyBleed>
            <FilterChips options={filters} value={category} onChange={setCategory} size="md" />
          </StickyBleed>
        </>
      }
    >
      {response?.featured ? (
        <View style={styles.padded}>
          <FeaturedArticleCard article={response.featured} onPress={() => openArticle(response.featured!.id)} />
        </View>
      ) : null}

      <View style={[styles.padded, styles.list]}>
        {response?.articles.map((a) => (
          <ArticleRow key={a.id} article={a} onPress={() => openArticle(a.id)} />
        ))}
        {isEmpty ? <Text style={styles.empty}>No articles match your search.</Text> : null}
      </View>
    </StickyScreen>
  );
}

const styles = StyleSheet.create({
  // Sections wrap themselves in `padded`, so the scroll area has no side padding.
  content: { paddingHorizontal: 0 },
  padded: { paddingHorizontal: 20 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  list: { gap: 12 },
  empty: { textAlign: "center", fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted, paddingVertical: 24 },
});
