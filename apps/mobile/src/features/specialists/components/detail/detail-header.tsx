import { Clock, MapPin, SealCheck, Star } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { colors, fonts } from "@/constants/theme";
import type { SpecialistDetail } from "../../types";

/** Tags, name, and the rating / distance / hours line. */
export function DetailHeader({ detail }: { detail: SpecialistDetail }) {
  return (
    <View style={styles.block}>
      <View style={styles.tags}>
        {detail.tags.map((tag) => (
          <Chip
            key={tag.label}
            label={tag.label}
            tone={tag.tone}
            size="md"
            icon={tag.verified ? SealCheck : undefined}
          />
        ))}
      </View>

      <Text style={styles.name}>{detail.name}</Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Star size={13} weight="fill" color={colors.warning} />
          <Text style={styles.metaText}>
            {detail.rating} ({detail.reviewCount})
          </Text>
        </View>
        <View style={styles.metaItem}>
          <MapPin size={13} color={colors.inkMuted} />
          <Text style={styles.metaText}>{detail.distanceKm.toFixed(1)} km</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={13} color={colors.success} />
          <Text style={styles.metaText}>{detail.hoursLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  tags: { flexDirection: "row", gap: 6 },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
});
