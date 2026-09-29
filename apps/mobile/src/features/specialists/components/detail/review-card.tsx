import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { SpecialistDetail } from "../../types";

export function ReviewCard({ review }: { review: NonNullable<SpecialistDetail["review"]> }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.author}>{review.author}</Text>
        <Text style={styles.stars}>{"★".repeat(Math.round(review.rating))}</Text>
      </View>
      <Text style={styles.text}>{review.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  head: { flexDirection: "row", justifyContent: "space-between" },
  author: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  stars: { fontFamily: fonts.bold, fontSize: 12, color: colors.warning },
  text: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
});
