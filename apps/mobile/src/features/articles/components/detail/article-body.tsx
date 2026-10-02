import { ArrowRight, Check, Quotes } from "phosphor-react-native";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { useOpenLink } from "@/features/content/hooks/use-open-link";
import type { ArticleBlock } from "../../types";

/** Renders the ordered content blocks of an article. Add a new block type in `Block` below. */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <View style={styles.body}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </View>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  const openLink = useOpenLink();

  switch (block.type) {
    case "paragraph":
      return <Text style={styles.paragraph}>{block.text}</Text>;

    case "heading":
      return <Text style={styles.heading}>{block.text}</Text>;

    case "bullets":
      return (
        <View style={styles.bullets}>
          {block.items.map((item) => (
            <View key={item} style={styles.bullet}>
              <View style={styles.bulletIcon}>
                <Check size={14} weight="bold" color={colors.success} />
              </View>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case "image":
      return <Image source={{ uri: block.url }} accessibilityLabel={block.alt} contentFit="cover" style={styles.image} />;

    case "cta":
      return (
        <Pressable accessibilityRole="button" onPress={() => openLink(block.link)} style={styles.cta}>
          <Text style={styles.ctaText}>{block.label}</Text>
          <ArrowRight size={14} color={colors.white} />
        </Pressable>
      );

    case "quote":
      return (
        <View style={styles.quote}>
          <Quotes size={20} weight="fill" color={colors.primary} />
          <Text style={styles.quoteText}>{block.text}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  body: { gap: 18 },
  image: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  ctaText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  paragraph: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: colors.ink },
  heading: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  bullets: { gap: 10 },
  bullet: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletIcon: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  bulletText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 20, color: colors.ink },
  quote: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  quoteText: { flex: 1, fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, color: colors.primary },
});
