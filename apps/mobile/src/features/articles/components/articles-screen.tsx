import { router } from "expo-router";
import { BookmarkSimple } from "phosphor-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { FilterChips } from "@/components/filter-chips";
import { SearchField } from "@/components/form/search-field";
import { IconButton } from "@/components/icon-button";
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
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.padded, styles.headRow]}>
          <BackButton />
          <Text style={styles.title}>Articles</Text>
          {/* TODO: open the saved articles screen. */}
          <IconButton icon={BookmarkSimple} label="Saved articles" />
        </View>

        <View style={styles.padded}>
          <SearchField value={query} onChange={setQuery} placeholder="Search articles" />
        </View>

        <FilterChips options={filters} value={category} onChange={setCategory} size="md" />

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 20, paddingTop: 8, paddingBottom: 32 },
  padded: { paddingHorizontal: 20 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  list: { gap: 12 },
  empty: { textAlign: "center", fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted, paddingVertical: 24 },
});
