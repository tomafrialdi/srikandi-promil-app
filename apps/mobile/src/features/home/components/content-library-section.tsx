import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts } from "@/constants/theme";
import type { Article, HomeDashboard } from "../types";

const CARD_WIDTH = 220;
const SIDE_PADDING = 20;

interface ContentLibrarySectionProps {
  data: HomeDashboard["library"];
  onViewAllPress?: () => void;
  onArticlePress?: (article: Article) => void;
}

/** Header + horizontally scrolling article cards that bleed to the screen edges. */
export function ContentLibrarySection({
  data,
  onViewAllPress,
  onArticlePress,
}: ContentLibrarySectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SectionHeader
          title={data.title}
          subtitle={data.subtitle}
          actionLabel={data.actionLabel}
          actionArrow
          onActionPress={onViewAllPress}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {data.articles.map((article) => (
          <ArticleCard key={article.id} article={article} onPress={() => onArticlePress?.(article)} />
        ))}
      </ScrollView>
    </View>
  );
}

function ArticleCard({ article, onPress }: { article: Article; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Image source={{ uri: article.imageUrl }} contentFit="cover" style={styles.image} />
      <View style={styles.content}>
        <Chip label={article.category} tone="primary" />
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.meta}>{article.readMinutes} min read</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  header: { paddingHorizontal: SIDE_PADDING },
  row: { gap: 12, paddingHorizontal: SIDE_PADDING },
  card: {
    width: CARD_WIDTH,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  image: { width: "100%", height: 110, backgroundColor: colors.surfaceAlt },
  content: { gap: 8, padding: 14 },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
});
