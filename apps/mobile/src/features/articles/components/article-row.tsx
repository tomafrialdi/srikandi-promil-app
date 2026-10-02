import { Image } from "expo-image";
import { CaretRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { colors, fonts } from "@/constants/theme";
import type { ArticleSummary } from "../types";

interface ArticleRowProps {
  article: ArticleSummary;
  onPress: () => void;
  /** Smaller thumbnail, no chevron, no author (used for related articles). */
  compact?: boolean;
}

export function ArticleRow({ article, onPress, compact }: ArticleRowProps) {
  const meta = compact
    ? `${article.readMinutes} min read`
    : `${article.readMinutes} min · By ${article.author}`;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Image
        source={article.imageUrl ? { uri: article.imageUrl } : undefined}
        contentFit="cover"
        style={compact ? styles.thumbCompact : styles.thumb}
      />
      <View style={[styles.text, compact && styles.textCompact]}>
        <Chip label={article.category.label} tone="primary" />
        <Text style={[styles.title, compact && styles.titleCompact]}>{article.title}</Text>
        <Text style={[styles.meta, compact && styles.metaCompact]}>{meta}</Text>
      </View>
      {compact ? null : <CaretRight size={16} color={colors.inkFaint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: colors.surfaceAlt },
  thumbCompact: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  text: { flex: 1, gap: 6 },
  textCompact: { gap: 5 },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  titleCompact: { fontSize: 12 },
  meta: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
  metaCompact: { fontSize: 10 },
});
