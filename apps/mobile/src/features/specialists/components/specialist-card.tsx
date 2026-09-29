import { MapPin, Star } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonOutline } from "@/components/button-outline";
import { ButtonPrimary } from "@/components/button-primary";
import { Chip } from "@/components/chip";
import { colors, fonts } from "@/constants/theme";
import { callPhone, openDirections } from "@/utils/external-links";
import type { SpecialistSummary } from "../types";

interface SpecialistCardProps {
  specialist: SpecialistSummary;
  /** Opens the detail page. Omit for rows that have none yet. */
  onPress?: () => void;
}

export function SpecialistCard({ specialist, onPress }: SpecialistCardProps) {
  const { name, typeLabel, availability, rating, address, distanceKm, phone, location } = specialist;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={!onPress} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.tags}>
            <Chip label={typeLabel} tone="primary" />
            <Chip label={availability.label} tone={availability.tone} />
          </View>
        </View>
        <View style={styles.rating}>
          <Star size={13} weight="fill" color={colors.warning} />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <MapPin size={13} color={colors.inkFaint} />
        <Text style={styles.address}>
          {address} · {distanceKm.toFixed(1)} km
        </Text>
      </View>

      <View style={styles.actions}>
        <ButtonOutline label="Call" compact style={styles.action} onPress={() => callPhone(phone)} />
        <ButtonPrimary
          label="Directions"
          style={{ ...styles.action, ...styles.compactButton }}
          onPress={() => openDirections(location)}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  top: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  titleBlock: { flex: 1, gap: 6 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  tags: { flexDirection: "row", gap: 6 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  address: { flex: 1, fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
  compactButton: { paddingVertical: 10, paddingHorizontal: 16 },
});
