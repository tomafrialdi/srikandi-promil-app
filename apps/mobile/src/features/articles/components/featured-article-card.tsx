import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { colors, fonts } from "@/constants/theme";
import type { ArticleSummary } from "../types";
import { ArticleMetaLine } from "./article-meta-line";

export function FeaturedArticleCard({ article, onPress }: { article: ArticleSummary; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Image source={article.imageUrl ? { uri: article.imageUrl } : undefined} contentFit="cover" style={styles.image} />
      <View style={styles.content}>
        <Chip label={article.category.label} tone="primary" />
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.excerpt}>{article.excerpt}</Text>
        <ArticleMetaLine text={`${article.readMinutes} min read · By ${article.author}`} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  image: { width: "100%", height: 170, backgroundColor: colors.surfaceAlt },
  content: { gap: 10, padding: 16 },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  excerpt: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
});
