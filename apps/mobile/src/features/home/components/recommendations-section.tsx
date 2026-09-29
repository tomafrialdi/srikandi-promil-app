import { CaretRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius, tones } from "@/constants/theme";
import { HOME_ICONS } from "../icons";
import type { HomeDashboard, Recommendation } from "../types";

interface RecommendationsSectionProps {
  data: HomeDashboard["recommendations"];
  onItemPress?: (item: Recommendation) => void;
}

export function RecommendationsSection({ data, onItemPress }: RecommendationsSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title={data.title} subtitle={data.subtitle} />
      <View style={styles.list}>
        {data.items.map((item) => (
          <RecommendationItem key={item.id} item={item} onPress={() => onItemPress?.(item)} />
        ))}
      </View>
    </View>
  );
}

function RecommendationItem({ item, onPress }: { item: Recommendation; onPress: () => void }) {
  const ItemIcon = HOME_ICONS[item.icon];
  const tone = tones[item.tone];

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
        <ItemIcon size={20} color={tone.fg} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Chip label={item.tag} tone={item.tone} />
      </View>
      <CaretRight size={16} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 6 },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  description: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
});
