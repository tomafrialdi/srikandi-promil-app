import { MagnifyingGlass } from "phosphor-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { ButtonPrimary } from "@/components/button-primary";
import { FilterChips } from "@/components/filter-chips";
import { IconButton } from "@/components/icon-button";
import { colors, fonts } from "@/constants/theme";
import { useCommunity } from "../hooks/use-community";
import { AnonymousBanner } from "./anonymous-banner";
import { PostCard } from "./post-card";

/** Community: anonymous posts by group. Opened from the Home header. */
export function CommunityScreen() {
  const { feed, activeGroupId, setGroupId, toggleHug } = useCommunity();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.padded, styles.headRow]}>
          <BackButton />
          <Text style={styles.title}>Community</Text>
          {/* TODO: search posts and groups. */}
          <IconButton icon={MagnifyingGlass} label="Search" />
        </View>

        {feed ? (
          <>
            <View style={styles.padded}>
              <AnonymousBanner alias={feed.me.alias} />
            </View>

            <FilterChips
              options={feed.groups}
              value={activeGroupId}
              onChange={setGroupId}
              size="md"
            />

            <View style={[styles.padded, styles.posts]}>
              {feed.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onHugPress={() => toggleHug(post.id)}
                  // TODO: open the post thread (replies) and the post menu (report / hide).
                />
              ))}
              {feed.posts.length === 0 ? (
                <Text style={styles.empty}>No posts in this group yet. Be the first to share.</Text>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* TODO: open the new post composer (no design yet). */}
        <ButtonPrimary label="Share your story" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 20, paddingTop: 8, paddingBottom: 24 },
  padded: { paddingHorizontal: 20 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  posts: { gap: 12 },
  empty: { textAlign: "center", fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted, paddingVertical: 32 },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
