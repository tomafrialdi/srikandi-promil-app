import { Check, Quotes } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
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
