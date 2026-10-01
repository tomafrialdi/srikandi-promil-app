import { Bell } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { IconCircle } from "@/components/icon-circle";
import { colors, fonts, radius } from "@/constants/theme";
import type { PartnerData } from "../types";

const PARTNER_AVATAR = "#1B5A9A";

/** Blue header card: the couple's avatars, status, and what the partner sees today. */
export function PartnerCard({ data }: { data: PartnerData & { partner: NonNullable<PartnerData["partner"]> } }) {
  return (
    <View style={styles.card}>
      <View style={styles.people}>
        <View style={styles.pair}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.initial}>{data.me.initial}</Text>
          </View>
          <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: PARTNER_AVATAR }]}>
            <Text style={styles.initial}>{data.partner.initial}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{data.me.name} &amp; {data.partner.name}</Text>
          <Text style={styles.status}>{data.status}</Text>
        </View>
      </View>

      <View style={styles.preview}>
        <IconCircle icon={Bell} tone="info" size={34} />
        <View style={styles.previewText}>
          <Text style={styles.previewLabel}>What {data.partner.name} sees today</Text>
          <Text style={styles.previewMessage}>{data.preview.message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16, padding: 20, borderRadius: 24, backgroundColor: colors.info },
  people: { flexDirection: "row", alignItems: "center", gap: 12 },
  pair: { flexDirection: "row" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlap: { marginLeft: -10 },
  initial: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  status: { fontFamily: fonts.medium, fontSize: 11, color: colors.whiteSoft },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  previewText: { flex: 1, gap: 1 },
  previewLabel: { fontFamily: fonts.bold, fontSize: 10, color: colors.inkFaint },
  previewMessage: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
});
