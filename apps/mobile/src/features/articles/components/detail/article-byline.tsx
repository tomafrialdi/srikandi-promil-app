import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { authorInitials, formatPublishedDate } from "../../utils/format";

interface ArticleBylineProps {
  author: string;
  publishedAt: string;
  readMinutes: number;
}

/** Avatar with the author's initials, name, and "May 18, 2026 · 5 min read". */
export function ArticleByline({ author, publishedAt, readMinutes }: ArticleBylineProps) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{authorInitials(author)}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.name}>{author}</Text>
        <Text style={styles.meta}>
          {formatPublishedDate(publishedAt)} · {readMinutes} min read
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  text: { gap: 1 },
  name: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
});
