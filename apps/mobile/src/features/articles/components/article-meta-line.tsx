import { Clock } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

/** "5 min read · By Dr. Amelia Wong" with a clock icon. */
export function ArticleMetaLine({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <Clock size={13} color={colors.inkFaint} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  text: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
});
