import { router } from "expo-router";
import { Image } from "expo-image";
import { BookmarkSimple, ShareNetwork } from "phosphor-react-native";
import { Share, StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/back-button";
import { Chip } from "@/components/chip";
import { IconButton } from "@/components/icon-button";
import { StickyScreen } from "@/components/sticky-screen";
import { colors, fonts } from "@/constants/theme";
import { useArticleDetail } from "../hooks/use-articles";
import { ArticleRow } from "./article-row";
import { ArticleBody } from "./detail/article-body";
import { ArticleByline } from "./detail/article-byline";

export function ArticleDetailScreen({ id }: { id: string }) {
  const { article, error, toggleBookmark } = useArticleDetail(id);

  if (error) {
    return (
      <StickyScreen header={<BackButton />}>
        <View style={styles.center}>
          <Text style={styles.errorText}>We couldn’t find this article.</Text>
        </View>
      </StickyScreen>
    );
  }

  if (!article) return <StickyScreen header={<BackButton />}><View /></StickyScreen>;

  return (
    <StickyScreen
      contentStyle={styles.content}
      header={
        <View style={styles.headRow}>
          <BackButton />
          <View style={styles.actions}>
            <IconButton
              icon={BookmarkSimple}
              label={article.bookmarked ? "Remove bookmark" : "Save article"}
              filled={article.bookmarked}
              onPress={toggleBookmark}
            />
            <IconButton
              icon={ShareNetwork}
              label="Share"
              // TODO: confirm the public article URL with the web team.
              onPress={() => Share.share({ message: `${article.title}\nhttps://srikandipromil.id/articles/${article.id}` })}
            />
          </View>
        </View>
      }
    >
        <View style={styles.heroWrap}>
          <Image source={{ uri: article.imageUrl }} contentFit="cover" style={styles.hero} />
        </View>

        <View style={[styles.padded, styles.body]}>
          <Chip label={article.category.label} tone="primary" />
          <Text style={styles.title}>{article.title}</Text>
          <ArticleByline
            author={article.author}
            publishedAt={article.publishedAt}
            readMinutes={article.readMinutes}
          />
          <ArticleBody blocks={article.body} />

          {article.related.length > 0 ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.relatedTitle}>Related articles</Text>
              <View style={styles.related}>
                {article.related.map((r) => (
                  <ArticleRow
                    key={r.id}
                    article={r}
                    compact
                    onPress={() => router.push({ pathname: "/articles/[id]", params: { id: r.id } })}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
    </StickyScreen>
  );
}

const styles = StyleSheet.create({
  // The hero and body pad themselves, so the scroll area has no side padding.
  content: { paddingHorizontal: 0, paddingTop: 0 },
  padded: { paddingHorizontal: 20 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actions: { flexDirection: "row", gap: 8 },
  heroWrap: { paddingTop: 16, paddingHorizontal: 20 },
  hero: { width: "100%", height: 200, borderRadius: 20, backgroundColor: colors.surfaceAlt },
  body: { gap: 18, paddingTop: 20 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.border },
  relatedTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  related: { gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkMuted },
});
