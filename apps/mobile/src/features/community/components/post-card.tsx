import { ChatCircle, DotsThree, Heart } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, tones, type Tone } from "@/constants/theme";
import type { CommunityPost } from "../types";
import { relativeTime } from "../utils/relative-time";

const AVATAR_TONES: Tone[] = ["warning", "success", "info", "primary"];

/** Same alias always gets the same avatar color. */
function avatarTone(alias: string): Tone {
  let hash = 0;
  for (const ch of alias) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

interface PostCardProps {
  post: CommunityPost;
  onHugPress: () => void;
  onRepliesPress?: () => void;
  onMenuPress?: () => void;
}

export function PostCard({ post, onHugPress, onRepliesPress, onMenuPress }: PostCardProps) {
  const tone = tones[avatarTone(post.authorAlias)];
  const hugColor = post.hugged ? colors.primary : colors.inkMuted;

  return (
    <View style={styles.card}>
      <View style={styles.author}>
        <View style={[styles.avatar, { backgroundColor: `${tone.fg}33` }]}>
          <Text style={[styles.initial, { color: tone.fg }]}>{post.authorAlias.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name}>{post.authorAlias}</Text>
          <Text style={styles.group}>
            {post.group.label} · {relativeTime(post.createdAt)}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="More options" hitSlop={8} onPress={onMenuPress}>
          <DotsThree size={20} weight="bold" color={colors.inkFaint} />
        </Pressable>
      </View>

      <Text style={styles.body}>{post.body}</Text>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: post.hugged }}
          onPress={onHugPress}
          hitSlop={8}
          style={styles.action}
        >
          <Heart size={14} weight={post.hugged ? "fill" : "regular"} color={hugColor} />
          <Text style={[styles.count, post.hugged && styles.countActive]}>{post.hugCount} hugs</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onRepliesPress} hitSlop={8} style={styles.action}>
          <ChatCircle size={14} color={colors.inkMuted} />
          <Text style={styles.count}>{post.replyCount} replies</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  author: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontFamily: fonts.bold, fontSize: 13 },
  meta: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  group: { fontFamily: fonts.medium, fontSize: 10, color: colors.inkFaint },
  body: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.ink },
  footer: { flexDirection: "row", alignItems: "center", gap: 16 },
  action: { flexDirection: "row", alignItems: "center", gap: 5 },
  count: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkMuted },
  countActive: { color: colors.primary },
});
