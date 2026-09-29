import { CaretRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, tones } from "@/constants/theme";
import type { CommunityPreview } from "../types";

/** Entry to the Community: a few member avatars, a tagline, and the latest post. */
export function CommunityCard({ community, onPress }: { community: CommunityPreview; onPress: () => void }) {
  const { latestPost } = community;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.members}>
          {community.members.map((member, i) => {
            const { fg } = tones[member.tone];
            return (
              <View
                key={member.initial}
                style={[styles.member, { backgroundColor: `${fg}33`, marginLeft: i === 0 ? 0 : -8 }]}
              >
                <Text style={[styles.initial, { color: fg }]}>{member.initial}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{community.title}</Text>
          <Text style={styles.subtitle}>{community.subtitle}</Text>
        </View>
        <CaretRight size={18} color={colors.inkFaint} />
      </View>

      <View style={styles.post}>
        <Text style={styles.body}>“{latestPost.body}”</Text>
        <Text style={styles.meta}>
          {latestPost.author} · {latestPost.groupLabel} · {latestPost.ageLabel} · {latestPost.hugCount} hugs
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  members: { flexDirection: "row", alignItems: "center" },
  member: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontFamily: fonts.bold, fontSize: 12 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  post: { gap: 4, padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  body: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: 10, color: colors.inkFaint },
});
